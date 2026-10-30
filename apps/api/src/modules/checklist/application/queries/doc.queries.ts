import { Inject, Logger } from '@nestjs/common';
import { CommandBus, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ChecklistDocKind } from '@prisma/client';

import { ChecklistErrorCode, ErrorLayer, NotFoundError, ValidationError } from '@portfolio/shared/errors';
import type { ChecklistDocDetail, ChecklistDocSummary } from '@portfolio/shared/types';

import { ListChecklistDocsSchema } from '../checklist.dto';
import { RefreshChecklistDocsCommand } from '../commands/refresh-docs.command';
import { ChecklistPresenter } from '../checklist.presenter';
import { CHECKLIST_DOC_REPOSITORY } from '../checklist.token';
import { IChecklistDocRepository } from '../ports/checklist-doc.repository.port';

/**
 * Live docs only: what a new run can be made from. The list answers from the stored copy at once
 * and starts a refresh when that copy is stale; a failed refresh is logged (the Owner sees the
 * error on "Update checklist").
 */
export class ListChecklistDocsQuery {
  constructor(readonly dto: unknown) {}
}

@QueryHandler(ListChecklistDocsQuery)
export class ListChecklistDocsHandler implements IQueryHandler<ListChecklistDocsQuery> {
  private readonly logger = new Logger(ListChecklistDocsHandler.name);

  constructor(
    @Inject(CHECKLIST_DOC_REPOSITORY) private readonly repo: IChecklistDocRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(query: ListChecklistDocsQuery): Promise<ChecklistDocSummary[]> {
    const { success, data, error } = ListChecklistDocsSchema.safeParse(query.dto ?? {});
    if (!success) {
      throw ValidationError(error, { errorCode: ChecklistErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    // Not awaited: the list never waits on the source. The next list shows what this refresh saved.
    this.commandBus
      .execute(new RefreshChecklistDocsCommand(false))
      .catch((refreshError: Error) => this.logger.warn(`Checklist refresh failed: ${refreshError.message}`));
    return (await this.repo.findLive(data.kind)).map(ChecklistPresenter.toDocSummary);
  }
}

/** Archived docs too: a run made before the archive still opens its references (CHK-002). */
export class GetChecklistDocQuery {
  constructor(
    readonly kind: string,
    readonly slug: string
  ) {}
}

@QueryHandler(GetChecklistDocQuery)
export class GetChecklistDocHandler implements IQueryHandler<GetChecklistDocQuery> {
  constructor(@Inject(CHECKLIST_DOC_REPOSITORY) private readonly repo: IChecklistDocRepository) {}

  async execute(query: GetChecklistDocQuery): Promise<ChecklistDocDetail> {
    const kind = query.kind.toUpperCase() as ChecklistDocKind;
    const doc = Object.values(ChecklistDocKind).includes(kind) ? await this.repo.findBySlug(kind, query.slug) : null;
    if (!doc) {
      throw NotFoundError('Doc not found', {
        errorCode: ChecklistErrorCode.DOC_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return ChecklistPresenter.toDocDetail(doc);
  }
}
