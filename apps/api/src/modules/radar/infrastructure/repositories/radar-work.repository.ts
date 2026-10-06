import { Injectable } from '@nestjs/common';
import { Prisma, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { ClaimedRadarItem, IRadarWorkRepository } from '../../application/ports/radar-work.repository.port';
import { RadarEnrichmentInput } from '../../application/radar-enrichment.schema';
import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarComment } from '../../domain/radar-comment.types';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { RADAR_ITEM_SELECT, RadarItemMapper } from '../mapper/radar-item.mapper';
import { PrismaService } from '../../../../shared/prisma';

const claimedSelect = {
  id: true,
  kind: true,
  permalink: true,
  authorName: true,
  publishedAt: true,
  text: true,
  media: true,
  links: true,
  sharedPost: true,
  engagement: true,
  comments: true,
  commentsStatus: true,
} as const;

@Injectable()
export class RadarWorkRepository implements IRadarWorkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(limit: number, leaseExpiresAt: Date, now: Date, maxAttempts: number): Promise<ClaimedRadarItem[]> {
    return this.prisma.$transaction(async (tx) => {
      // `leaseExpiresAt` is `timestamp` (UTC wall time, no zone); casting the ISO string keeps the
      // comparison independent of the session time zone.
      // SKIP LOCKED: a concurrent claim passes over rows this one holds instead of waiting for them,
      // so two workers never leave with the same item.
      // The source and run checks are subqueries, not joins, so the row lock stays on radar_items alone.
      // An item whose run is still fetching comments waits for them, so its analysis can use them.
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM radar_items
        WHERE "claimCount" < ${maxAttempts}
          AND EXISTS (SELECT 1 FROM radar_sources s WHERE s.id = radar_items."sourceId" AND s."isActive")
          AND NOT (radar_items."commentsStatus" = 'NOT_FETCHED' AND EXISTS (
                SELECT 1 FROM radar_runs r
                JOIN radar_step_runs e ON e."runId" = r.id AND e.step = 'ENRICH'
                WHERE r.id = radar_items."lastRunId" AND r."fetchComments" AND r.status = 'RUNNING'
                  AND e.status <> 'DONE'))
          AND ("workStatus" = 'PENDING'
               OR ("workStatus" = 'CLAIMED' AND "leaseExpiresAt" < ${now.toISOString()}::timestamp(3)))
        ORDER BY "publishedAt" DESC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED`;
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) return [];

      await tx.radarItem.updateMany({
        where: { id: { in: ids } },
        data: { workStatus: RadarWorkStatus.CLAIMED, leaseExpiresAt, claimCount: { increment: 1 } },
      });
      const items = await tx.radarItem.findMany({
        where: { id: { in: ids } },
        select: claimedSelect,
        orderBy: { publishedAt: 'desc' },
      });

      return items.map((i) => ({
        ...i,
        media: i.media as unknown as RadarMedia[],
        links: i.links as unknown as RadarLink[],
        sharedPost: i.sharedPost as unknown as RadarSharedPost | null,
        engagement: i.engagement as unknown as RadarEngagement,
        comments: i.comments as unknown as RadarComment[],
        leaseExpiresAt,
      }));
    });
  }

  async findById(itemId: string): Promise<RadarItem | null> {
    const row = await this.prisma.radarItem.findUnique({ where: { id: itemId }, select: RADAR_ITEM_SELECT });
    return row ? RadarItemMapper.toDomain(row) : null;
  }

  async saveEnrichment(item: RadarItem, enrichment: RadarEnrichmentInput): Promise<boolean> {
    const { producer, ...fields } = enrichment;
    const data = { ...fields, producerAdapter: producer.adapter, producerModel: producer.model };

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.radarItem.updateMany({
        where: { id: item.id },
        data: RadarItemMapper.toWorkPersistence(item) as Prisma.RadarItemUpdateManyMutationInput,
      });
      if (count === 0) return false;

      await tx.radarEnrichment.upsert({
        where: { itemId: item.id },
        create: { id: IdentifierValue.v7(), itemId: item.id, ...data },
        update: data,
      });
      return true;
    });
  }
}
