import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { RequeueStuckResponseDto } from '../radar.dto';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

/** The Owner's retry button: stuck items get a fresh set of claim attempts. */
export class RequeueStuckCommand {}

@CommandHandler(RequeueStuckCommand)
export class RequeueStuckHandler implements ICommandHandler<RequeueStuckCommand> {
  constructor(@Inject(RADAR_ITEM_REPOSITORY) private readonly repo: IRadarItemRepository) {}

  async execute(): Promise<RequeueStuckResponseDto> {
    return { requeued: await this.repo.requeueStuck(new Date(), RadarLeasePolicy.MAX_CLAIM_ATTEMPTS) };
  }
}
