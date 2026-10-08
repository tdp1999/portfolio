import { ChecklistDoc as ChecklistDocRow, ChecklistRun as ChecklistRunRow, Prisma } from '@prisma/client';

import type { ChecklistDocContent, ChecklistRunBody } from '@portfolio/shared/types';

import { ChecklistDoc } from '../../domain/entities/checklist-doc.entity';
import { ChecklistRun } from '../../domain/entities/checklist-run.entity';

export class ChecklistMapper {
  static docToDomain(row: ChecklistDocRow): ChecklistDoc {
    return ChecklistDoc.load({
      id: row.id,
      kind: row.kind,
      slug: row.slug,
      title: row.title,
      content: row.content as unknown as ChecklistDocContent,
      sourceHash: row.sourceHash,
      archivedAt: row.archivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static docToPersistence(doc: ChecklistDoc): Prisma.ChecklistDocUncheckedCreateInput {
    return {
      id: doc.id,
      kind: doc.kind,
      slug: doc.slug,
      title: doc.title,
      content: doc.content as unknown as Prisma.InputJsonValue,
      sourceHash: doc.sourceHash,
      archivedAt: doc.archivedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  static runToDomain(row: ChecklistRunRow): ChecklistRun {
    return ChecklistRun.load({
      id: row.id,
      name: row.name,
      templateSlug: row.templateSlug,
      templateTitle: row.templateTitle,
      projectSlug: row.projectSlug,
      status: row.status,
      body: row.body as unknown as ChecklistRunBody,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static runToPersistence(run: ChecklistRun): Prisma.ChecklistRunUncheckedCreateInput {
    return {
      id: run.id,
      name: run.name,
      templateSlug: run.templateSlug,
      templateTitle: run.templateTitle,
      projectSlug: run.projectSlug,
      status: run.status,
      body: run.body as unknown as Prisma.InputJsonValue,
      version: run.version,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }
}
