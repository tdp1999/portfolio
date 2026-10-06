import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';

import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { TriageRadarItemsResponseDto, TriageRadarItemsSchema } from '../radar.dto';
import { RADAR_ITEM_REPOSITORY } from '../radar.token';

/**
 * The Owner's triage decision (Done, To try, back to Inbox) for one or more posts. Undo sends the
 * previous status through the same command. Ids that do not exist are ignored, not an error: a
 * post removed with its source between the list load and the click has nothing left to triage.
 */
export class TriageItemsCommand {
  constructor(readonly body: unknown) {}
}

@CommandHandler(TriageItemsCommand)
export class TriageItemsHandler implements ICommandHandler<TriageItemsCommand> {
  constructor(@Inject(RADAR_ITEM_REPOSITORY) private readonly repo: IRadarItemRepository) {}

  async execute(command: TriageItemsCommand): Promise<TriageRadarItemsResponseDto> {
    const { success, data, error } = TriageRadarItemsSchema.safeParse(command.body);
    if (!success) {
      throw ValidationError(error, {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Triage radar items validation failed',
      });
    }
    return { updated: await this.repo.setTriage(data.ids, data.status, new Date()) };
  }
}
