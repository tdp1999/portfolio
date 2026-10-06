import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { IRadarWorkRepository } from '../ports/radar-work.repository.port';
import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { ClaimWorkResponseDto, ClaimWorkSchema } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_WORK_REPOSITORY } from '../radar.token';

export class ClaimWorkCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(ClaimWorkCommand)
export class ClaimWorkHandler implements ICommandHandler<ClaimWorkCommand> {
  constructor(@Inject(RADAR_WORK_REPOSITORY) private readonly repo: IRadarWorkRepository) {}

  async execute(command: ClaimWorkCommand): Promise<ClaimWorkResponseDto> {
    const { success, data, error } = ClaimWorkSchema.safeParse(command.dto ?? {});
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    const now = new Date();
    const items = await this.repo.claim(
      data.limit,
      RadarLeasePolicy.expiresAt(now),
      now,
      RadarLeasePolicy.MAX_CLAIM_ATTEMPTS
    );
    return {
      step: data.step,
      leaseExpiresAt: items[0]?.leaseExpiresAt ?? null,
      items: items.map(RadarPresenter.toWorkItem),
    };
  }
}
