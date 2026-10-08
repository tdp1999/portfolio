import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ChecklistErrorCode, ErrorLayer, NotFoundError } from '@portfolio/shared/errors';
import type { ChecklistRunDetail, ChecklistRunSummary } from '@portfolio/shared/types';

import { ChecklistPresenter } from '../checklist.presenter';
import { CHECKLIST_RUN_REPOSITORY } from '../checklist.token';
import { IChecklistRunRepository } from '../ports/checklist-run.repository.port';

/** Every run, most recently touched first; the page splits active from done and archived. */
export class ListChecklistRunsQuery {}

@QueryHandler(ListChecklistRunsQuery)
export class ListChecklistRunsHandler implements IQueryHandler<ListChecklistRunsQuery> {
  constructor(@Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository) {}

  async execute(): Promise<ChecklistRunSummary[]> {
    return (await this.runs.findAll()).map(ChecklistPresenter.toRunSummary);
  }
}

export class GetChecklistRunQuery {
  constructor(readonly id: string) {}
}

@QueryHandler(GetChecklistRunQuery)
export class GetChecklistRunHandler implements IQueryHandler<GetChecklistRunQuery> {
  constructor(@Inject(CHECKLIST_RUN_REPOSITORY) private readonly runs: IChecklistRunRepository) {}

  async execute(query: GetChecklistRunQuery): Promise<ChecklistRunDetail> {
    const run = await this.runs.findById(query.id);
    if (!run) {
      throw NotFoundError('Run not found', {
        errorCode: ChecklistErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return ChecklistPresenter.toRunDetail(run);
  }
}
