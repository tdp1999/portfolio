import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChecklistDocKind } from '@prisma/client';
import { createHash } from 'node:crypto';
import { z } from 'zod/v4';

import { BadRequestError, ChecklistErrorCode, ErrorLayer, ServiceUnavailableError } from '@portfolio/shared/errors';
import type { ChecklistRefreshResult } from '@portfolio/shared/types';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ParsedChecklistFile } from '../../domain/checklist.types';
import { ChecklistMarkdownParser } from '../checklist-markdown.parser';
import { ChecklistManifest, ChecklistManifestSchema, ChecklistRunBodySchema } from '../checklist.dto';
import { CHECKLIST_DOC_REPOSITORY, CHECKLIST_SOURCE } from '../checklist.token';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';
import { IChecklistSource } from '../ports/checklist-source.port';

/** `force`: the Owner pressed "Update checklist". Otherwise a refresh runs only when the last one is stale. */
export class RefreshChecklistDocsCommand {
  constructor(readonly force: boolean) {}
}

/**
 * Makes the lanes and the lookup table match the checklist source (the plugin repo): read
 * `manifest.json`, then every file it lists. Every file is read and parsed before anything is
 * written, so one bad file or an unknown format keeps the current docs. A lane or lookup table
 * that left the manifest is archived (CHK-002). Old project profiles are left alone, and runs are
 * never touched (CHK-001).
 *
 * The handler is a singleton, so it keeps when the next automatic refresh may run: 10 minutes
 * after a successful one, 1 minute after a failed one. Two refreshes at once share one read.
 */
@CommandHandler(RefreshChecklistDocsCommand)
export class RefreshChecklistDocsHandler implements ICommandHandler<RefreshChecklistDocsCommand> {
  // --- Constants ---

  private static readonly MANIFEST = 'manifest.json';
  private static readonly MANIFEST_FORMAT = 2;
  private static readonly STALE_AFTER_MS = 10 * 60 * 1000;
  /** A failed refresh is retried sooner, but not on every list call while the source is down. */
  private static readonly RETRY_AFTER_MS = 60 * 1000;
  // Column width of checklist_docs.title; checked here so an overlong title is a 400 naming the file, not a 500.
  private static readonly MAX_TITLE = 200;
  /** The kinds the source owns. PROJECT docs were pushed by the old sync and stay for old runs. */
  private static readonly SOURCE_KINDS: readonly ChecklistDocKind[] = [
    ChecklistDocKind.TEMPLATE,
    ChecklistDocKind.LOOKUP,
  ];

  private nextAttemptAt: number | null = null;
  private inFlight: Promise<ChecklistRefreshResult> | null = null;

  constructor(
    @Inject(CHECKLIST_DOC_REPOSITORY) private readonly repo: IChecklistDocRepository,
    @Inject(CHECKLIST_SOURCE) private readonly source: IChecklistSource
  ) {}

  async execute(command: RefreshChecklistDocsCommand): Promise<ChecklistRefreshResult | null> {
    if (this.inFlight) return this.inFlight;
    if (!command.force && this.nextAttemptAt !== null && Date.now() < this.nextAttemptAt) return null;

    this.nextAttemptAt = Date.now() + RefreshChecklistDocsHandler.RETRY_AFTER_MS;
    this.inFlight = this.refresh()
      .then((result) => {
        this.nextAttemptAt = Date.now() + RefreshChecklistDocsHandler.STALE_AFTER_MS;
        return result;
      })
      .finally(() => (this.inFlight = null));
    return this.inFlight;
  }

  // --- Private ---

  private async refresh(): Promise<ChecklistRefreshResult> {
    const manifest = RefreshChecklistDocsHandler.parseManifest(await this.read(RefreshChecklistDocsHandler.MANIFEST));
    const [lanes, lookup] = await Promise.all([
      Promise.all(manifest.lanes.map((lane) => this.read(lane.path))),
      this.read(manifest.lookup),
    ]);

    const files: ParsedChecklistFile[] = [
      ...manifest.lanes.map((lane, i) => RefreshChecklistDocsHandler.parseLane(lane, lanes[i])),
      RefreshChecklistDocsHandler.parseLookup(manifest.lookup, lookup),
    ];
    return this.save(files);
  }

  private async save(files: ParsedChecklistFile[]): Promise<ChecklistRefreshResult> {
    const result: ChecklistRefreshResult = { created: [], updated: [], unchanged: [], archived: [] };
    const created: ChecklistDoc[] = [];
    const changed: ChecklistDoc[] = [];
    const existing = new Map(
      (await this.repo.findAll()).map((doc) => [RefreshChecklistDocsHandler.keyOf(doc.kind, doc.slug), doc])
    );
    const read = new Set(files.map((file) => RefreshChecklistDocsHandler.keyOf(file.kind, file.slug)));

    for (const file of files) {
      const doc = existing.get(RefreshChecklistDocsHandler.keyOf(file.kind, file.slug));
      if (!doc) {
        created.push(ChecklistDoc.create(file));
        result.created.push(file.slug);
        continue;
      }
      const next = doc.resync(file);
      if (next) changed.push(next);
      (next ? result.updated : result.unchanged).push(file.slug);
    }

    for (const [key, doc] of existing) {
      if (read.has(key) || !RefreshChecklistDocsHandler.SOURCE_KINDS.includes(doc.kind)) continue;
      const next = doc.archive();
      if (!next) continue;
      changed.push(next);
      result.archived.push(doc.slug);
    }

    await this.repo.saveSync(created, changed);
    return result;
  }

  private async read(path: string): Promise<string> {
    try {
      return await this.source.read(path);
    } catch (error) {
      // A domain error, not an infrastructure one: the Owner's "Update checklist" shows this message.
      throw ServiceUnavailableError(`${path}: the checklist source could not be read`, {
        errorCode: ChecklistErrorCode.SOURCE_UNAVAILABLE,
        layer: ErrorLayer.INFRASTRUCTURE,
        remarks: (error as Error).message,
      });
    }
  }

  private static parseManifest(text: string): ChecklistManifest {
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw BadRequestError(`${RefreshChecklistDocsHandler.MANIFEST}: not valid JSON`, {
        errorCode: ChecklistErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const { success, data, error } = ChecklistManifestSchema.safeParse(json);
    if (!success) {
      throw BadRequestError(`${RefreshChecklistDocsHandler.MANIFEST}: ${z.prettifyError(error)}`, {
        errorCode: ChecklistErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    if (data.format !== RefreshChecklistDocsHandler.MANIFEST_FORMAT) {
      throw BadRequestError(`${RefreshChecklistDocsHandler.MANIFEST}: format ${data.format} is not supported`, {
        errorCode: ChecklistErrorCode.UNSUPPORTED_FORMAT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return data;
  }

  /** A lane takes its slug and title from the manifest, so renaming the file never orphans its runs' template slug. */
  private static parseLane(lane: ChecklistManifest['lanes'][number], markdown: string): ParsedChecklistFile {
    const { content } = ChecklistMarkdownParser.parseTemplate(markdown, lane.path);
    const fits = ChecklistRunBodySchema.safeParse(content);
    if (!fits.success) {
      throw BadRequestError(`${lane.path}: a run made from it could not be saved: ${z.prettifyError(fits.error)}`, {
        errorCode: ChecklistErrorCode.INVALID_MARKDOWN,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return {
      kind: ChecklistDocKind.TEMPLATE,
      slug: lane.slug,
      title: lane.title,
      content,
      sourceHash: RefreshChecklistDocsHandler.hash(markdown),
    };
  }

  /** The lookup table's slug is its file stem (`lookup.md` → `lookup`), the slug the page asks for. */
  private static parseLookup(path: string, markdown: string): ParsedChecklistFile {
    const { title, content } = ChecklistMarkdownParser.parseSectioned(markdown, path);
    if (title.length > RefreshChecklistDocsHandler.MAX_TITLE) {
      throw BadRequestError(`${path}: title over ${RefreshChecklistDocsHandler.MAX_TITLE} characters`, {
        errorCode: ChecklistErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    return {
      kind: ChecklistDocKind.LOOKUP,
      slug,
      title,
      content,
      sourceHash: RefreshChecklistDocsHandler.hash(markdown),
    };
  }

  private static hash(markdown: string): string {
    return createHash('sha256').update(markdown).digest('hex');
  }

  private static keyOf(kind: ChecklistDocKind, slug: string): string {
    return `${kind}:${slug}`;
  }
}
