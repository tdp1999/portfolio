import { RadarTriageStatus } from '@prisma/client';

export interface RadarNoteRecord {
  id: string;
  itemId: string;
  body: string;
  triageStatus: RadarTriageStatus | null;
  createdAt: Date;
}

/** The Owner's notes on a post: why it was triaged, and what came of it. */
export interface IRadarNoteRepository {
  /** Null when the item does not exist (it may have gone with its source). */
  create(note: Omit<RadarNoteRecord, 'createdAt'>): Promise<RadarNoteRecord | null>;
  /** The item's notes, newest first. */
  listByItem(itemId: string): Promise<RadarNoteRecord[]>;
  /** False when no note of that item has that id. */
  delete(itemId: string, noteId: string): Promise<boolean>;
}
