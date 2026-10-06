import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { ClaimBriefResponseDto } from '../radar.dto';
import { RADAR_BRIEF_REPOSITORY } from '../radar.token';

/** The worker takes the oldest waiting brief under the same lease as a batch of posts. */
export class ClaimBriefCommand {}

@CommandHandler(ClaimBriefCommand)
export class ClaimBriefHandler implements ICommandHandler<ClaimBriefCommand> {
  constructor(@Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository) {}

  async execute(): Promise<ClaimBriefResponseDto> {
    const now = new Date();
    const brief = await this.briefs.claim(RadarLeasePolicy.expiresAt(now), now);
    if (!brief) return { brief: null };

    const itemIds = await this.briefs.windowItemIds(brief);
    return {
      brief: {
        id: brief.id,
        sourceId: brief.sourceId,
        windowFrom: brief.windowFrom,
        windowTo: brief.windowTo,
        workStatus: brief.workStatus,
        leaseExpiresAt: brief.leaseExpiresAt,
        itemCount: itemIds.length,
      },
    };
  }
}
