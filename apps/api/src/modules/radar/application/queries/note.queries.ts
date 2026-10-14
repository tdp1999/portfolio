import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IdentifierValue } from '@portfolio/shared/types';

import { IRadarNoteRepository } from '../ports/radar-note.repository.port';
import { RadarItemNoteDto } from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_NOTE_REPOSITORY } from '../radar.token';

/** A post's notes, newest first. Unknown ids give an empty list. */
export class ListItemNotesQuery {
  constructor(readonly itemId: string) {}
}

@QueryHandler(ListItemNotesQuery)
export class ListItemNotesHandler implements IQueryHandler<ListItemNotesQuery> {
  constructor(@Inject(RADAR_NOTE_REPOSITORY) private readonly notes: IRadarNoteRepository) {}

  async execute(query: ListItemNotesQuery): Promise<RadarItemNoteDto[]> {
    IdentifierValue.from(query.itemId);
    return (await this.notes.listByItem(query.itemId)).map((note) => RadarPresenter.toNote(note));
  }
}
