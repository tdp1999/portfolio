import type {
  ChecklistDocDetail,
  ChecklistDocSummary,
  ChecklistRunDetail,
  ChecklistRunSummary,
} from '@portfolio/shared/types';

import { ChecklistDoc } from '../domain/entities/checklist-doc.entity';
import { ChecklistRun } from '../domain/entities/checklist-run.entity';

export class ChecklistPresenter {
  static toDocSummary(doc: ChecklistDoc): ChecklistDocSummary {
    return {
      kind: doc.kind,
      slug: doc.slug,
      title: doc.title,
      archived: doc.isArchived,
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  static toDocDetail(doc: ChecklistDoc): ChecklistDocDetail {
    return { ...ChecklistPresenter.toDocSummary(doc), content: doc.content };
  }

  static toRunSummary(run: ChecklistRun): ChecklistRunSummary {
    return {
      id: run.id,
      name: run.name,
      templateSlug: run.templateSlug,
      templateTitle: run.templateTitle,
      projectSlug: run.projectSlug,
      status: run.status,
      progress: run.progress,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString(),
    };
  }

  static toRunDetail(run: ChecklistRun): ChecklistRunDetail {
    return { ...ChecklistPresenter.toRunSummary(run), body: run.body, version: run.version };
  }
}
