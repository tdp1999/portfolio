/**
 * `pnpm backfill:canonical` — one-off backfill of the `*Canonical` columns for
 * content authored BEFORE those columns existed.
 *
 * Covers EVERY rich-text field (ADR-023 contract): `project.body`,
 * `blog-post.content`, `profile.bioLong`, `experience.{description,responsibilities,
 * highlights}`, and `technical-highlight.{challenge,approach,outcome}`. Rows saved
 * before their canonical column existed are already at `LATEST_SCHEMA_VERSION` with
 * `canonical = null`, so `pnpm migrate:editor` skips them (its `version >= LATEST`
 * guard). This script fills the gap: it reads each row's existing `*Json` (E's Tiptap
 * doc, the re-edit source), runs it back through {@link RichTextService} (the SAME
 * write pipeline the console uses), and writes back **only** the `*Canonical` column
 * — `*Json` and `*Html` are left untouched.
 *
 * Adding a new RTE field → add one entry to {@link MODULES} (that's the whole change
 * here; the loop is field-agnostic).
 *
 * Once a row has canonical, the landing read-path switches from the `<rte-render-html>`
 * HTML fallback to the live `<rte-render [doc]>` AST path for that content.
 *
 * Properties:
 * - **Idempotent.** A row that already has canonical is skipped (use `--force` to
 *   recompute). Deterministic: canonical is derived purely from the stored `*Json`.
 * - **Non-destructive.** Writes a single column; never touches `*Json`/`*Html`/version.
 *   Reverting is `UPDATE … SET "bodyCanonical" = NULL` — the page falls back to HTML.
 * - **Standalone.** Connects to Prisma directly; the API server need not be up.
 *
 * Flags:
 *   --dry-run          report what would change without writing
 *   --force            recompute + overwrite canonical even if already present
 *   --module=<name>    scope to one model (project | blog-post | profile |
 *                      experience | technical-highlight) or one exact field key
 *                      (e.g. experience.highlights)
 *
 *   pnpm backfill:canonical --dry-run
 *   pnpm backfill:canonical
 *   pnpm backfill:canonical --module=profile
 *   pnpm backfill:canonical --module=experience.highlights
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(__dirname, '../../../.env') });

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RichTextService } from '../src/modules/rich-text';

const LOG = '[backfill:canonical]';

interface ModuleSpec {
  /** Unique field key (`<model>.<field>`), used in logs + exact `--module=` match. */
  key: string;
  /** Model name for `--module=` scoping + logs. */
  model: string;
  /** `PrismaClient` delegate name. */
  delegate: 'project' | 'blogPost' | 'profile' | 'experience' | 'technicalHighlight';
  /** Source column (E's Tiptap `{ en, vi }` envelope). */
  jsonCol: string;
  /** Destination column (our PortableDocument `{ en, vi }` envelope). */
  canonicalCol: string;
  /** Friendly field label for logs. */
  label: string;
}

// One entry per RTE field (ADR-023). The loop below is field-agnostic — extending
// coverage is purely additive here.
const MODULES: ModuleSpec[] = [
  {
    key: 'project.body',
    model: 'project',
    delegate: 'project',
    jsonCol: 'bodyJson',
    canonicalCol: 'bodyCanonical',
    label: 'body',
  },
  {
    key: 'blog-post.content',
    model: 'blog-post',
    delegate: 'blogPost',
    jsonCol: 'contentJson',
    canonicalCol: 'contentCanonical',
    label: 'content',
  },
  {
    key: 'profile.bioLong',
    model: 'profile',
    delegate: 'profile',
    jsonCol: 'bioLongJson',
    canonicalCol: 'bioLongCanonical',
    label: 'bioLong',
  },
  {
    key: 'experience.description',
    model: 'experience',
    delegate: 'experience',
    jsonCol: 'descriptionJson',
    canonicalCol: 'descriptionCanonical',
    label: 'description',
  },
  {
    key: 'experience.responsibilities',
    model: 'experience',
    delegate: 'experience',
    jsonCol: 'responsibilitiesJson',
    canonicalCol: 'responsibilitiesCanonical',
    label: 'responsibilities',
  },
  {
    key: 'experience.highlights',
    model: 'experience',
    delegate: 'experience',
    jsonCol: 'highlightsJson',
    canonicalCol: 'highlightsCanonical',
    label: 'highlights',
  },
  {
    key: 'technical-highlight.challenge',
    model: 'technical-highlight',
    delegate: 'technicalHighlight',
    jsonCol: 'challengeJson',
    canonicalCol: 'challengeCanonical',
    label: 'challenge',
  },
  {
    key: 'technical-highlight.approach',
    model: 'technical-highlight',
    delegate: 'technicalHighlight',
    jsonCol: 'approachJson',
    canonicalCol: 'approachCanonical',
    label: 'approach',
  },
  {
    key: 'technical-highlight.outcome',
    model: 'technical-highlight',
    delegate: 'technicalHighlight',
    jsonCol: 'outcomeJson',
    canonicalCol: 'outcomeCanonical',
    label: 'outcome',
  },
];

interface Flags {
  dryRun: boolean;
  force: boolean;
  module?: string;
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { dryRun: false, force: false };
  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--force') flags.force = true;
    else if (arg.startsWith('--module=')) flags.module = arg.slice('--module='.length).trim();
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return flags;
}

/** A stored `*Json` column holds the `{ en, vi }` translatable envelope. */
type StoredTranslatable = { en?: EditorDocument; vi?: EditorDocument };

/** Empty doc for a locale that is somehow absent (write path normally stores both). */
const emptyDoc = (): EditorDocument =>
  ({ schemaVersion: 1, content: { type: 'doc', content: [] } }) as unknown as EditorDocument;

interface Tally {
  scanned: number;
  filled: number;
  skipped: number;
  errors: number;
}

/** True when a `*Canonical` value already carries at least one rendered node. */
function hasCanonicalContent(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).some(
    (v) =>
      v != null &&
      typeof v === 'object' &&
      Array.isArray((v as { content?: unknown[] }).content) &&
      (v as { content: unknown[] }).content.length > 0
  );
}

async function backfillModule(
  spec: ModuleSpec,
  prisma: PrismaClient,
  richText: RichTextService,
  flags: Flags
): Promise<Tally> {
  const tally: Tally = { scanned: 0, filled: 0, skipped: 0, errors: 0 };

  const delegate = prisma[spec.delegate] as unknown as {
    findMany(args: { select: Record<string, true> }): Promise<Record<string, unknown>[]>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };

  const rows = await delegate.findMany({
    select: { id: true, [spec.jsonCol]: true, [spec.canonicalCol]: true },
  });

  for (const row of rows) {
    tally.scanned += 1;
    const id = row['id'] as string;
    const json = row[spec.jsonCol] as StoredTranslatable | null;
    const existing = row[spec.canonicalCol];

    if (json == null) {
      // No editor source to derive from — nothing to backfill.
      tally.skipped += 1;
      continue;
    }
    if (!flags.force && hasCanonicalContent(existing)) {
      // Already active; leave it alone unless --force.
      tally.skipped += 1;
      continue;
    }

    try {
      const canonical = await richText.toCanonicalFormTranslatable(
        { en: json.en ?? emptyDoc(), vi: json.vi ?? emptyDoc() },
        `${spec.key}.${id}.${spec.label}`
      );
      if (!flags.dryRun) {
        await delegate.update({
          where: { id },
          data: { [spec.canonicalCol]: canonical.canonical as unknown as Prisma.InputJsonValue },
        });
      }
      tally.filled += 1;

      const en = (canonical.canonical as unknown as { en?: { content?: unknown[] } }).en;
      const vi = (canonical.canonical as unknown as { vi?: { content?: unknown[] } }).vi;
      const nEn = en?.content?.length ?? 0;
      const nVi = vi?.content?.length ?? 0;
      console.log(
        `${LOG} ${flags.dryRun ? 'DRY ' : ''}${spec.key} ${id}: ${spec.label} canonical filled (en:${nEn} vi:${nVi} nodes)`
      );
    } catch (cause) {
      tally.errors += 1;
      const reason = cause instanceof Error ? cause.message : String(cause);
      console.error(`${LOG} ERROR ${spec.key} ${id} ${spec.label}: ${reason}`);
    }
  }

  return tally;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));

  let modules = MODULES;
  if (flags.module) {
    // Match a whole model (e.g. `experience`) or one exact field key (e.g.
    // `experience.highlights`).
    modules = MODULES.filter((m) => m.model === flags.module || m.key === flags.module);
    if (modules.length === 0) {
      const models = [...new Set(MODULES.map((m) => m.model))].join(', ');
      const keys = MODULES.map((m) => m.key).join(', ');
      throw new Error(`Unknown --module=${flags.module}. Valid models: ${models}. Valid keys: ${keys}`);
    }
  }

  console.log(
    `${LOG} start${flags.dryRun ? ' (dry-run)' : ''}${flags.force ? ' (force)' : ''}` +
      `${flags.module ? ` — module=${flags.module}` : ''}`
  );

  const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
  const prisma = new PrismaClient({ adapter });
  const richText = new RichTextService();

  const total: Tally = { scanned: 0, filled: 0, skipped: 0, errors: 0 };
  try {
    for (const spec of modules) {
      const t = await backfillModule(spec, prisma, richText, flags);
      total.scanned += t.scanned;
      total.filled += t.filled;
      total.skipped += t.skipped;
      total.errors += t.errors;
      console.log(
        `${LOG} ${spec.key}: ${t.scanned} scanned, ${t.filled} filled, ${t.skipped} skipped, ${t.errors} errors`
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  const verb = flags.dryRun ? 'would fill' : 'filled';
  console.log(
    `${LOG} done — ${total.scanned} scanned, ${total.filled} ${verb}, ${total.skipped} skipped${total.errors ? `, ${total.errors} errors` : ''}`
  );
  if (total.errors > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`${LOG}`, e);
  process.exit(1);
});
