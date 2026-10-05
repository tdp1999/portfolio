import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { RadarWorkflowProfileDto, UpsertWorkflowProfileSchema } from '../radar.dto';
import { RADAR_PROFILE_REPOSITORY } from '../radar.token';

export class UpsertWorkflowProfileCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(UpsertWorkflowProfileCommand)
export class UpsertWorkflowProfileHandler implements ICommandHandler<UpsertWorkflowProfileCommand> {
  constructor(@Inject(RADAR_PROFILE_REPOSITORY) private readonly repo: IRadarProfileRepository) {}

  async execute(command: UpsertWorkflowProfileCommand): Promise<RadarWorkflowProfileDto> {
    const { success, data, error } = UpsertWorkflowProfileSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    return this.repo.upsert(data.body);
  }
}
