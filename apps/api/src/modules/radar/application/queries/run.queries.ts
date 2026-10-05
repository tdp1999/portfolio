import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RUN_LIST_LIMIT, RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_RUN_REPOSITORY } from '../radar.token';

/** Runs are started by hand a few times a month, so the newest 50 cover the Runs page. */
export class ListRunsQuery {}

@QueryHandler(ListRunsQuery)
export class ListRunsHandler implements IQueryHandler<ListRunsQuery> {
  constructor(@Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository) {}

  async execute(): Promise<RadarRunDto[]> {
    return (await this.runs.list(RUN_LIST_LIMIT)).map(RadarPresenter.toRun);
  }
}

export class GetRunQuery {
  constructor(readonly runId: string) {}
}

@QueryHandler(GetRunQuery)
export class GetRunHandler implements IQueryHandler<GetRunQuery> {
  constructor(@Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository) {}

  async execute(query: GetRunQuery): Promise<RadarRunDto> {
    IdentifierValue.from(query.runId);
    const run = await this.runs.findById(query.runId);
    if (!run) {
      throw NotFoundError('Radar run not found', {
        errorCode: RadarErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return RadarPresenter.toRun(run);
  }
}
