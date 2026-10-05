import { Injectable } from '@nestjs/common';
import { RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import { ClaimedRadarItem, IRadarWorkRepository } from '../../application/ports/radar-work.repository.port';
import { RadarEnrichmentInput } from '../../application/radar-enrichment.schema';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
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
} as const;

@Injectable()
export class RadarWorkRepository implements IRadarWorkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async claim(limit: number, leaseMs: number, now: Date, maxAttempts: number): Promise<ClaimedRadarItem[]> {
    const leaseExpiresAt = new Date(now.getTime() + leaseMs);

    return this.prisma.$transaction(async (tx) => {
      // `leaseExpiresAt` is `timestamp` (UTC wall time, no zone); casting the ISO string keeps the
      // comparison independent of the session time zone.
      // SKIP LOCKED: a concurrent claim passes over rows this one holds instead of waiting for them,
      // so two workers never leave with the same item.
      // The source check is a subquery, not a join, so the row lock stays on radar_items alone.
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM radar_items
        WHERE "claimCount" < ${maxAttempts}
          AND EXISTS (SELECT 1 FROM radar_sources s WHERE s.id = radar_items."sourceId" AND s."isActive")
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
        leaseExpiresAt,
      }));
    });
  }

  async saveEnrichment(itemId: string, enrichment: RadarEnrichmentInput): Promise<boolean> {
    const { producer, ...fields } = enrichment;
    const data = { ...fields, producerAdapter: producer.adapter, producerModel: producer.model };

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.radarItem.findUnique({ where: { id: itemId }, select: { id: true } });
      if (!item) return false;

      await tx.radarEnrichment.upsert({
        where: { itemId },
        create: { id: IdentifierValue.v7(), itemId, ...data },
        update: data,
      });
      await tx.radarItem.update({
        where: { id: itemId },
        data: { workStatus: RadarWorkStatus.DONE, leaseExpiresAt: null },
      });
      return true;
    });
  }
}
