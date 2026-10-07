import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RadarRunFlow } from '@prisma/client';

import { ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { AI_CLIENT, type IAiClient } from '../../../ai';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RADAR_RUN_AI_GROUP } from '../radar-analysis.config';
import { RUN_LIST_LIMIT, RadarRunDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_RUN_REPOSITORY } from '../radar.token';

/** Runs are started by hand a few times a month, so the newest 50 cover the Runs page. */
export class ListRunsQuery {}

@QueryHandler(ListRunsQuery)
export class ListRunsHandler implements IQueryHandler<ListRunsQuery> {
  constructor(
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    @Inject(AI_CLIENT) private readonly ai: IAiClient
  ) {}

  async execute(): Promise<RadarRunDto[]> {
    const runs = await this.runs.list(RUN_LIST_LIMIT);
    // One grouped sum for every AUTO run on the page, not one query per row.
    const autoIds = runs.filter((r) => r.flow === RadarRunFlow.AUTO).map((r) => r.id);
    const spent = await this.ai.spentByGroup(RADAR_RUN_AI_GROUP, autoIds);
    return runs.map((run) => RadarPresenter.toRun(run, spent.get(run.id) ?? 0));
  }
}

export class GetRunQuery {
  constructor(readonly runId: string) {}
}

@QueryHandler(GetRunQuery)
export class GetRunHandler implements IQueryHandler<GetRunQuery> {
  constructor(
    @Inject(RADAR_RUN_REPOSITORY) private readonly runs: IRadarRunRepository,
    @Inject(AI_CLIENT) private readonly ai: IAiClient
  ) {}

  async execute(query: GetRunQuery): Promise<RadarRunDto> {
    IdentifierValue.from(query.runId);
    const run = await this.runs.findById(query.runId);
    if (!run) {
      throw NotFoundError('Radar run not found', {
        errorCode: RadarErrorCode.RUN_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    const spent =
      run.flow === RadarRunFlow.AUTO ? await this.ai.spentMicroUsd({ type: RADAR_RUN_AI_GROUP, id: run.id }) : null;
    return RadarPresenter.toRun(run, spent);
  }
}
