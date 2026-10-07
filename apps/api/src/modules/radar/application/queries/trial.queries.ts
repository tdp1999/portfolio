import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { RadarTrialStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarTrialRepository, RadarTrialRecord } from '../ports/radar-trial.repository.port';
import { RadarTrialDto } from '../radar.dto';
import { RADAR_TRIAL_REPOSITORY } from '../radar.token';

/** An item's quality trials, newest first (task 419). Unknown ids give an empty list. */
export class ListItemTrialsQuery {
  constructor(readonly itemId: string) {}
}

@QueryHandler(ListItemTrialsQuery)
export class ListItemTrialsHandler implements IQueryHandler<ListItemTrialsQuery> {
  // --- Constants ---

  /**
   * Trials run in memory, so a restart loses the ones in flight and their rows stay RUNNING. The
   * clock starts at the request and trials queue one at a time (a full batch of 10 deep trials can
   * take close to an hour in the worst case), so only a trial older than this was interrupted.
   */
  private static readonly INTERRUPTED_AFTER_MS = 60 * 60_000;

  constructor(@Inject(RADAR_TRIAL_REPOSITORY) private readonly trials: IRadarTrialRepository) {}

  async execute(query: ListItemTrialsQuery): Promise<RadarTrialDto[]> {
    IdentifierValue.from(query.itemId);
    const now = Date.now();
    return (await this.trials.listByItem(query.itemId)).map((trial) => ListItemTrialsHandler.toDto(trial, now));
  }

  // --- Private ---

  private static toDto(trial: RadarTrialRecord, now: number): RadarTrialDto {
    const interrupted =
      trial.status === RadarTrialStatus.RUNNING &&
      now - trial.createdAt.getTime() > ListItemTrialsHandler.INTERRUPTED_AFTER_MS;
    return {
      id: trial.id,
      depth: trial.depth,
      requestedModel: trial.requestedModel,
      status: interrupted ? RadarTrialStatus.FAILED : trial.status,
      enrichment: trial.payload,
      error: interrupted ? 'Interrupted (the server restarted while it ran)' : trial.error,
      tokensIn: trial.inputTokens,
      tokensOut: trial.outputTokens,
      costMicroUsd: trial.costMicroUsd,
      searchQueries: trial.searchQueries,
      latencyMs: trial.latencyMs,
      createdAt: trial.createdAt.toISOString(),
      finishedAt: trial.finishedAt?.toISOString() ?? null,
    };
  }
}
