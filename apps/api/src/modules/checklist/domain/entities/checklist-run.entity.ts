import { ChecklistDocKind, ChecklistRunStatus } from '@prisma/client';

import { BadRequestError, ChecklistErrorCode, ConflictError, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import type {
  ChecklistProgress,
  ChecklistRow,
  ChecklistRunBody,
  ChecklistTask,
  ChecklistTemplateContent,
} from '@portfolio/shared/types';

import { ChecklistRunProps, UpdateChecklistRunPayload } from '../checklist.types';
import { ChecklistDoc } from './checklist-doc.entity';

/**
 * One working copy of a template for one ticket. The body is copied at creation and then belongs
 * to the run alone: pushing the template again never touches it (CHK-001).
 */
export class ChecklistRun {
  private constructor(private readonly props: ChecklistRunProps) {}

  // --- Factory Methods ---

  /** Only a live template starts a run, tied to a live project profile (CHK-002). */
  static create(name: string, template: ChecklistDoc, project: ChecklistDoc): ChecklistRun {
    if (template.kind !== ChecklistDocKind.TEMPLATE || project.kind !== ChecklistDocKind.PROJECT) {
      throw BadRequestError('A run needs a template and a project profile', {
        errorCode: ChecklistErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (template.isArchived || project.isArchived) {
      throw BadRequestError('Archived docs cannot start a run', {
        errorCode: ChecklistErrorCode.DOC_ARCHIVED,
        layer: ErrorLayer.DOMAIN,
      });
    }
    const now = TemporalValue.now();
    return new ChecklistRun({
      id: IdentifierValue.v7(),
      name,
      templateSlug: template.slug,
      templateTitle: template.title,
      projectSlug: project.slug,
      status: ChecklistRunStatus.ACTIVE,
      body: ChecklistRun.freshBody(template.content as ChecklistTemplateContent),
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(props: ChecklistRunProps): ChecklistRun {
    return new ChecklistRun(props);
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get templateSlug(): string {
    return this.props.templateSlug;
  }

  get templateTitle(): string {
    return this.props.templateTitle;
  }

  get projectSlug(): string {
    return this.props.projectSlug;
  }

  get status(): ChecklistRunStatus {
    return this.props.status;
  }

  get body(): ChecklistRunBody {
    return this.props.body;
  }

  get version(): number {
    return this.props.version;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /** Tasks done or skipped, over all tasks (CHK-003). A group counts through its children. */
  get progress(): ChecklistProgress {
    const tasks = this.props.body.phases.flatMap((phase) => phase.rows.flatMap(ChecklistRun.tasksOf));
    return { complete: tasks.filter((task) => task.state !== 'todo').length, total: tasks.length };
  }

  // --- Rules ---

  update(data: UpdateChecklistRunPayload): ChecklistRun {
    return new ChecklistRun({
      ...this.props,
      name: data.name ?? this.props.name,
      status: data.status ?? this.props.status,
      updatedAt: TemporalValue.now(),
    });
  }

  /**
   * The page saves the whole body with the version it loaded. An older version means another tab
   * saved in between; taking this save would silently drop that one.
   */
  replaceBody(body: ChecklistRunBody, baseVersion: number): ChecklistRun {
    if (baseVersion !== this.props.version) {
      throw ConflictError('This run was saved elsewhere. Reload to get the latest version', {
        errorCode: ChecklistErrorCode.RUN_VERSION_CONFLICT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new ChecklistRun({ ...this.props, body, version: this.props.version + 1, updatedAt: TemporalValue.now() });
  }

  // --- Private ---

  private static tasksOf(row: ChecklistRow): ChecklistTask[] {
    return row.kind === 'task' ? [row] : row.children;
  }

  /** The template's rows, every task back to todo with no note. */
  private static freshBody(template: ChecklistTemplateContent): ChecklistRunBody {
    const resetTask = (task: ChecklistTask): ChecklistTask => ({ ...task, state: 'todo', note: '' });
    return {
      ...template,
      phases: template.phases.map((phase) => ({
        ...phase,
        rows: phase.rows.map((row) =>
          row.kind === 'task' ? resetTask(row) : { ...row, note: '', children: row.children.map(resetTask) }
        ),
      })),
    };
  }
}
