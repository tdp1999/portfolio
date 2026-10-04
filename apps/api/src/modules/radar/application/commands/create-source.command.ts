import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ConflictError, ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRadarSourceSchema, RadarSourceResponseDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_SOURCE_REPOSITORY } from '../radar.token';

export class CreateSourceCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(CreateSourceCommand)
export class CreateSourceHandler implements ICommandHandler<CreateSourceCommand> {
  constructor(@Inject(RADAR_SOURCE_REPOSITORY) private readonly repo: IRadarSourceRepository) {}

  async execute(command: CreateSourceCommand): Promise<RadarSourceResponseDto> {
    const { success, data, error } = CreateRadarSourceSchema.safeParse(command.dto);
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }

    if (await this.repo.findByUrl(data.url)) {
      throw ConflictError('A radar source with this URL already exists', {
        errorCode: RadarErrorCode.SOURCE_URL_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const source = await this.repo.create({ id: IdentifierValue.v7(), ...data });
    return RadarPresenter.toSource(source);
  }
}
