import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, NotFoundError, RadarErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** Deactivating keeps the source and its items; it only blocks new captures. */
export class SetSourceActiveCommand {
  constructor(
    readonly sourceId: string,
    readonly isActive: boolean
  ) {}
}

@CommandHandler(SetSourceActiveCommand)
export class SetSourceActiveHandler implements ICommandHandler<SetSourceActiveCommand> {
  constructor(@Inject(RADAR_SOURCE_REPOSITORY) private readonly repo: IRadarSourceRepository) {}

  async execute(command: SetSourceActiveCommand): Promise<void> {
    IdentifierValue.from(command.sourceId);

    const source = await this.repo.findById(command.sourceId);
    if (!source) {
      throw NotFoundError('Radar source not found', {
        errorCode: RadarErrorCode.SOURCE_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    await this.repo.save(source.setActive(command.isActive));
  }
}
