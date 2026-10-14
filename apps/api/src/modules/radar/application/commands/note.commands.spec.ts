import { RadarTriageStatus } from '@prisma/client';

import { IRadarNoteRepository } from '../ports/radar-note.repository.port';
import {
  CreateItemNoteCommand,
  CreateItemNoteHandler,
  DeleteItemNoteCommand,
  DeleteItemNoteHandler,
} from './note.commands';

const ITEM_ID = '01a10b5b-9d90-753e-a6a3-000000000101';
const NOTE_ID = '01a10b5b-9d90-753e-a6a3-000000000201';

const repo = (overrides: Partial<IRadarNoteRepository> = {}): IRadarNoteRepository => ({
  create: jest.fn(async (note) => ({ ...note, createdAt: new Date('2026-10-14T09:00:00Z') })),
  listByItem: jest.fn().mockResolvedValue([]),
  delete: jest.fn().mockResolvedValue(true),
  ...overrides,
});

describe('CreateItemNoteHandler', () => {
  it('should keep the trimmed note with the decision it explains', async () => {
    const notes = repo();

    const dto = await new CreateItemNoteHandler(notes).execute(
      new CreateItemNoteCommand(ITEM_ID, { body: '  Tried the CLI, works  ', triageStatus: 'DONE' })
    );

    expect(notes.create).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: ITEM_ID, body: 'Tried the CLI, works', triageStatus: RadarTriageStatus.DONE })
    );
    expect(dto).toMatchObject({
      body: 'Tried the CLI, works',
      triageStatus: 'DONE',
      createdAt: '2026-10-14T09:00:00.000Z',
    });
  });

  it('should store a note without a decision as null', async () => {
    const notes = repo();

    await new CreateItemNoteHandler(notes).execute(new CreateItemNoteCommand(ITEM_ID, { body: 'Later' }));

    expect(notes.create).toHaveBeenCalledWith(expect.objectContaining({ triageStatus: null }));
  });

  it('should reject an empty note', async () => {
    await expect(
      new CreateItemNoteHandler(repo()).execute(new CreateItemNoteCommand(ITEM_ID, { body: '   ' }))
    ).rejects.toThrow();
  });

  it('should answer not found when the post is gone', async () => {
    const notes = repo({ create: jest.fn().mockResolvedValue(null) });

    await expect(
      new CreateItemNoteHandler(notes).execute(new CreateItemNoteCommand(ITEM_ID, { body: 'x' }))
    ).rejects.toThrow('Radar item not found');
  });
});

describe('DeleteItemNoteHandler', () => {
  it('should report a note already gone as not deleted, without failing', async () => {
    const notes = repo({ delete: jest.fn().mockResolvedValue(false) });

    await expect(
      new DeleteItemNoteHandler(notes).execute(new DeleteItemNoteCommand(ITEM_ID, NOTE_ID))
    ).resolves.toEqual({
      deleted: false,
    });
  });
});
