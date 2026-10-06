import { Injectable } from '@nestjs/common';
import { RadarCommentsStatus } from '@prisma/client';

import { IRadarCommentsRepository } from '../../application/ports/radar-comments.repository.port';
import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RADAR_ITEM_SELECT, RadarItemMapper } from '../mapper/radar-item.mapper';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarCommentsRepository implements IRadarCommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCandidates(runId: string): Promise<RadarItem[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: { lastRunId: runId, commentsStatus: RadarCommentsStatus.NOT_FETCHED },
      select: RADAR_ITEM_SELECT,
      orderBy: { publishedAt: 'desc' },
    });
    return rows.map((row) => RadarItemMapper.toDomain(row));
  }

  async findById(itemId: string): Promise<RadarItem | null> {
    const row = await this.prisma.radarItem.findUnique({ where: { id: itemId }, select: RADAR_ITEM_SELECT });
    return row ? RadarItemMapper.toDomain(row) : null;
  }

  async findByIds(itemIds: readonly string[]): Promise<RadarItem[]> {
    if (itemIds.length === 0) return [];
    const rows = await this.prisma.radarItem.findMany({
      where: { id: { in: [...itemIds] } },
      select: RADAR_ITEM_SELECT,
    });
    return rows.map((row) => RadarItemMapper.toDomain(row));
  }

  async findBySource(sourceId: string): Promise<RadarItem[]> {
    const rows = await this.prisma.radarItem.findMany({ where: { sourceId }, select: RADAR_ITEM_SELECT });
    return rows.map((row) => RadarItemMapper.toDomain(row));
  }

  async saveComments(item: RadarItem): Promise<void> {
    await this.prisma.radarItem.update({
      where: { id: item.id },
      data: RadarItemMapper.toCommentsPersistence(item),
    });
  }

  async saveCommentsFailure(items: readonly RadarItem[]): Promise<void> {
    // Items failed together share one error, so this is one statement in practice.
    const byError = new Map<string | null, string[]>();
    for (const item of items) byError.set(item.commentsError, [...(byError.get(item.commentsError) ?? []), item.id]);
    await this.prisma.$transaction(
      [...byError].map(([commentsError, ids]) =>
        this.prisma.radarItem.updateMany({
          where: { id: { in: ids } },
          data: { commentsStatus: RadarCommentsStatus.FAILED, commentsError },
        })
      )
    );
  }
}
