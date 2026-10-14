import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { ErrorLayer, NotFoundError, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarNoteRepository } from '../ports/radar-note.repository.port';
import { CreateRadarItemNoteSchema, RadarItemNoteDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_NOTE_REPOSITORY } from '../radar.token';

/** Keeps one note on a post: why it was marked Done or To try, or what the Owner did with it. */
export class CreateItemNoteCommand {
  constructor(
    readonly itemId: string,
    readonly body: unknown
  ) {}
}

@CommandHandler(CreateItemNoteCommand)
export class CreateItemNoteHandler implements ICommandHandler<CreateItemNoteCommand> {
  constructor(@Inject(RADAR_NOTE_REPOSITORY) private readonly notes: IRadarNoteRepository) {}

  async execute(command: CreateItemNoteCommand): Promise<RadarItemNoteDto> {
    IdentifierValue.from(command.itemId);
    const { success, data, error } = CreateRadarItemNoteSchema.safeParse(command.body);
    if (!success) {
      throw ValidationError(error, {
        errorCode: RadarErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Create radar item note validation failed',
      });
    }
    const note = await this.notes.create({ id: IdentifierValue.v7(), itemId: command.itemId, ...data });
    if (!note) {
      throw NotFoundError('Radar item not found', {
        errorCode: RadarErrorCode.ITEM_NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }
    return RadarPresenter.toNote(note);
  }
}

/** Removes one note. A note already gone is not an error: the result is the same. */
export class DeleteItemNoteCommand {
  constructor(
    readonly itemId: string,
    readonly noteId: string
  ) {}
}

@CommandHandler(DeleteItemNoteCommand)
export class DeleteItemNoteHandler implements ICommandHandler<DeleteItemNoteCommand> {
  constructor(@Inject(RADAR_NOTE_REPOSITORY) private readonly notes: IRadarNoteRepository) {}

  async execute(command: DeleteItemNoteCommand): Promise<{ deleted: boolean }> {
    IdentifierValue.from(command.itemId);
    IdentifierValue.from(command.noteId);
    return { deleted: await this.notes.delete(command.itemId, command.noteId) };
  }
}
