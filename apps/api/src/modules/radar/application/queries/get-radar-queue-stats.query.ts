import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { RadarQueueStatsDto } from '../radar.dto';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

/** Counts for the Feed header: work still queued, items the worker gave up on, items paused with their source. */
export class GetRadarQueueStatsQuery {}

@QueryHandler(GetRadarQueueStatsQuery)
export class GetRadarQueueStatsHandler implements IQueryHandler<GetRadarQueueStatsQuery> {
  constructor(@Inject(RADAR_ITEM_REPOSITORY) private readonly repo: IRadarItemRepository) {}

  async execute(): Promise<RadarQueueStatsDto> {
    return this.repo.stats(new Date(), RadarLeasePolicy.MAX_CLAIM_ATTEMPTS);
  }
}
