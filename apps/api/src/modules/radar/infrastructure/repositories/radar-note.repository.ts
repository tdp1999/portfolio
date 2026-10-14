import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IRadarNoteRepository, RadarNoteRecord } from '../../application/ports/radar-note.repository.port';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarNoteRepository implements IRadarNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** A missing item fails the foreign key (P2003), which means "no such item", not an error. */
  async create(note: Omit<RadarNoteRecord, 'createdAt'>): Promise<RadarNoteRecord | null> {
    try {
      return await this.prisma.radarItemNote.create({ data: note });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') return null;
      throw e;
    }
  }

  async listByItem(itemId: string): Promise<RadarNoteRecord[]> {
    return await this.prisma.radarItemNote.findMany({ where: { itemId }, orderBy: { createdAt: 'desc' } });
  }

  async delete(itemId: string, noteId: string): Promise<boolean> {
    const { count } = await this.prisma.radarItemNote.deleteMany({ where: { id: noteId, itemId } });
    return count > 0;
  }
}
