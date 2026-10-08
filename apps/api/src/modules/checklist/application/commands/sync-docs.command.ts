import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChecklistDocKind } from '@prisma/client';
import { createHash } from 'node:crypto';

import { BadRequestError, ChecklistErrorCode, ErrorLayer, ValidationError } from '@portfolio/shared/errors';
import type { ChecklistSyncResult } from '@portfolio/shared/types';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ParsedChecklistFile } from '../../domain/checklist.types';
import { ChecklistFilePolicy } from '../../domain/policies/checklist-file.policy';
import { ChecklistMarkdownParser } from '../checklist-markdown.parser';
import { SyncChecklistDocsSchema } from '../checklist.dto';
import { CHECKLIST_DOC_REPOSITORY } from '../checklist.token';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';

export class SyncChecklistDocsCommand {
  constructor(readonly dto: unknown) {}
}

/**
 * Makes the docs match the pushed folder. Every file is parsed before anything is written, so one
 * unreadable file rejects the whole push. A doc whose file was not sent is archived (CHK-002);
 * runs are never touched (CHK-001).
 */
@CommandHandler(SyncChecklistDocsCommand)
export class SyncChecklistDocsHandler implements ICommandHandler<SyncChecklistDocsCommand> {
  // Column widths of checklist_docs; checked here so an overlong name is a 400 naming the file, not a 500.
  private static readonly MAX_SLUG = 100;
  private static readonly MAX_TITLE = 200;

  constructor(@Inject(CHECKLIST_DOC_REPOSITORY) private readonly repo: IChecklistDocRepository) {}

  async execute(command: SyncChecklistDocsCommand): Promise<ChecklistSyncResult> {
    const { success, data, error } = SyncChecklistDocsSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: ChecklistErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const pushed = new Map<string, ParsedChecklistFile>();
    for (const file of data.files) {
      const parsed = SyncChecklistDocsHandler.parseFile(file.path, file.content);
      const key = SyncChecklistDocsHandler.keyOf(parsed.kind, parsed.slug);
      if (pushed.has(key)) {
        throw BadRequestError(`${file.path}: another file in this push has the same name`, {
          errorCode: ChecklistErrorCode.INVALID_INPUT,
          layer: ErrorLayer.APPLICATION,
        });
      }
      pushed.set(key, parsed);
    }

    const result: ChecklistSyncResult = { created: [], updated: [], unchanged: [], archived: [] };
    const created: ChecklistDoc[] = [];
    const changed: ChecklistDoc[] = [];
    const existing = new Map(
      (await this.repo.findAll()).map((doc) => [SyncChecklistDocsHandler.keyOf(doc.kind, doc.slug), doc])
    );

    for (const [key, file] of pushed) {
      const doc = existing.get(key);
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
      if (pushed.has(key)) continue;
      const next = doc.archive();
      if (!next) continue;
      changed.push(next);
      result.archived.push(doc.slug);
    }

    await this.repo.saveSync(created, changed);
    return result;
  }

  private static parseFile(path: string, content: string): ParsedChecklistFile {
    const target = ChecklistFilePolicy.classify(path);
    if (!target) {
      throw BadRequestError(`${path}: not a lane checklist, the lookup table or a project profile`, {
        errorCode: ChecklistErrorCode.UNKNOWN_FILE,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const { title, content: parsed } =
      target.kind === ChecklistDocKind.TEMPLATE
        ? ChecklistMarkdownParser.parseTemplate(content, path)
        : ChecklistMarkdownParser.parseSectioned(content, path);
    if (target.slug.length > SyncChecklistDocsHandler.MAX_SLUG || title.length > SyncChecklistDocsHandler.MAX_TITLE) {
      throw BadRequestError(
        `${path}: file name over ${SyncChecklistDocsHandler.MAX_SLUG} or title over ${SyncChecklistDocsHandler.MAX_TITLE} characters`,
        { errorCode: ChecklistErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION }
      );
    }
    return { ...target, title, content: parsed, sourceHash: createHash('sha256').update(content).digest('hex') };
  }

  private static keyOf(kind: ChecklistDocKind, slug: string): string {
    return `${kind}:${slug}`;
  }
}
