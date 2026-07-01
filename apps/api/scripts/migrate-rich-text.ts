/**
 * `pnpm migrate:editor` — lazy schema-migration escape hatch.
 *
 * Rich-text rows are migrated lazily by default: the write path runs `migrateDoc`
 * on every save, so stored content upgrades to {@link LATEST_SCHEMA_VERSION} on the
 * next edit. This script is the **manual override** — run it when the engine ships
 * a render-breaking schema bump and we can't wait for organic edits to drain the
 * old version out.
 *
 * For each model with rich-text columns it scans every row, and for each field
 * whose `*SchemaVersion` is below the latest it re-canonicalizes the stored JSON
 * through {@link RichTextService} (migrate → Tiptap HTML → DOMPurify sanitize) and
 * writes the fresh `{ json, html, schemaVersion }` triplet back. Reusing the
 * service means this path can never drift from the write path's sanitization.
 *
 * Properties:
 * - **Idempotent.** A fully-migrated DB produces zero writes and exits 0
 *   (`migrateDoc` is itself idempotent; a field already at latest is left alone).
 * - **Standalone.** Connects to Prisma directly — the API server need not be up.
 *
 * Flags:
 *   --dry-run          report what would change without writing
 *   --module=<name>    scope to one model: profile | experience | project |
 *                      technical-highlight | blog-post
 *
 *   pnpm migrate:editor
 *   pnpm migrate:editor --dry-run
 *   pnpm migrate:editor --module=blog-post
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { LATEST_SCHEMA_VERSION } from '@phuong-tran-redoc/document-engine-core';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RichTextService } from '../src/modules/rich-text';

const LOG = '[migrate:editor]';

/** One rich-text field's storage triplet: canonical JSON, HTML cache, version. */
interface FieldCols {
  /** Friendly label for logs (e.g. `bioLong`). */
  name: string;
  json: string;
  html: string;
  version: string;
  /** Optional canonical PortableDocument column (prose-block epic) — only the
   *  AST-rendered fields (project.body, blog.content) have one. */
  canonical?: string;
}

/** A model that carries one or more rich-text fields. */
interface ModuleSpec {
  /** Canonical flag value for `--module=`. */
  key: string;
  /** `PrismaClient` delegate name. */
  delegate: 'profile' | 'experience' | 'project' | 'technicalHighlight' | 'blogPost';
  fields: FieldCols[];
}

const field = (name: string, canonical?: string): FieldCols => ({
  name,
  json: `${name}Json`,
  html: `${name}Html`,
  version: `${name}SchemaVersion`,
  canonical,
});

/** Every model with rich-text columns, in a stable processing order. */
const MODULES: ModuleSpec[] = [
  { key: 'profile', delegate: 'profile', fields: [field('bioLong')] },
  {
    key: 'experience',
    delegate: 'experience',
    fields: [field('description'), field('responsibilities'), field('highlights')],
  },
  { key: 'project', delegate: 'project', fields: [field('body', 'bodyCanonical')] },
  {
    key: 'technical-highlight',
    delegate: 'technicalHighlight',
    fields: [field('challenge'), field('approach'), field('outcome')],
  },
  { key: 'blog-post', delegate: 'blogPost', fields: [field('content', 'contentCanonical')] },
];

interface Flags {
  dryRun: boolean;
  module?: string;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { dryRun: false };
  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg.startsWith('--module=')) flags.module = arg.slice('--module='.length).trim();
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return flags;
}

/** A stored `*Json` column always holds the `{ en, vi }` translatable envelope. */
type StoredTranslatable = { en: EditorDocument; vi: EditorDocument };

/** Per-model tally rolled up into the final summary. */
interface Tally {
  scanned: number;
  migrated: number;
  skipped: number;
  errors: number;
}

async function migrateModule(
  spec: ModuleSpec,
  prisma: PrismaClient,
  richText: RichTextService,
  flags: Flags
): Promise<Tally> {
  const tally: Tally = { scanned: 0, migrated: 0, skipped: 0, errors: 0 };

  // Pull only the columns we touch: id + each field's json/version. (HTML is
  // regenerated, never read.) Casting to a loose record keeps the dynamic column
  // access ergonomic without per-model generics.
  const select: Record<string, true> = { id: true };
  for (const f of spec.fields) {
    select[f.json] = true;
    select[f.version] = true;
  }

  const delegate = prisma[spec.delegate] as unknown as {
    findMany(args: { select: Record<string, true> }): Promise<Record<string, unknown>[]>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };

  const rows = await delegate.findMany({ select });

  for (const row of rows) {
    tally.scanned += 1;
    const id = row['id'] as string;
    const data: Record<string, unknown> = {};
    const touched: string[] = [];

    for (const f of spec.fields) {
      const version = row[f.version] as number;
      const json = row[f.json] as StoredTranslatable | null;
      // Up to date, or never backfilled — nothing to upgrade for this field.
      if (json == null || version >= LATEST_SCHEMA_VERSION) continue;

      try {
        const canonical = await richText.toCanonicalFormTranslatable(
          { en: json.en, vi: json.vi },
          `${spec.key}.${id}.${f.name}`
        );
        data[f.json] = canonical.json as unknown as Prisma.InputJsonValue;
        data[f.html] = canonical.html as unknown as Prisma.InputJsonValue;
        data[f.version] = canonical.schemaVersion;
        if (f.canonical) data[f.canonical] = canonical.canonical as unknown as Prisma.InputJsonValue;
        touched.push(`${f.name} v${version}→v${canonical.schemaVersion}`);
      } catch (cause) {
        tally.errors += 1;
        const reason = cause instanceof Error ? cause.message : String(cause);
        console.error(`${LOG} ERROR ${spec.key} ${id} ${f.name}: ${reason}`);
      }
    }

    if (touched.length === 0) {
      tally.skipped += 1;
      continue;
    }

    if (!flags.dryRun) await delegate.update({ where: { id }, data });
    tally.migrated += 1;
    console.log(`${LOG} ${flags.dryRun ? 'DRY ' : ''}${spec.key} ${id}: ${touched.join(', ')}`);
  }

  return tally;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  let modules = MODULES;
  if (flags.module) {
    const picked = MODULES.find((m) => m.key === flags.module);
    if (!picked) {
      throw new Error(`Unknown --module=${flags.module}. Valid: ${MODULES.map((m) => m.key).join(', ')}`);
    }
    modules = [picked];
  }

  console.log(
    `${LOG} latest schema version v${LATEST_SCHEMA_VERSION}${flags.dryRun ? ' (dry-run)' : ''}` +
      `${flags.module ? ` — module=${flags.module}` : ''}`
  );

  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });
  const richText = new RichTextService();

  const total: Tally = { scanned: 0, migrated: 0, skipped: 0, errors: 0 };
  try {
    for (const spec of modules) {
      const t = await migrateModule(spec, prisma, richText, flags);
      total.scanned += t.scanned;
      total.migrated += t.migrated;
      total.skipped += t.skipped;
      total.errors += t.errors;
    }
  } finally {
    await prisma.$disconnect();
  }

  const verb = flags.dryRun ? 'would migrate' : 'migrated';
  console.log(
    `${LOG} done — ${total.scanned} rows scanned, ${total.migrated} ${verb}, ${total.skipped} skipped` +
      `${total.errors ? `, ${total.errors} errors` : ''}`
  );

  if (total.errors > 0) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => {
    console.error(`${LOG}`, e);
    process.exit(1);
  });
}
