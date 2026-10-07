import { Injectable } from '@nestjs/common';
import { Prisma, RadarWorkStatus } from '@prisma/client';

import { IdentifierValue } from '@portfolio/shared/types';

import {
  ClaimedRadarItem,
  IRadarWorkRepository,
  RadarWorkSnapshot,
} from '../../application/ports/radar-work.repository.port';
import { RadarEnrichmentInput } from '../../application/radar-enrichment.schema';
import { RadarItem } from '../../domain/entities/radar-item.entity';
import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
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
  /** The column's length. */
  private static readonly MAX_WORK_ERROR = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async claim(
    limit: number,
    leaseExpiresAt: Date,
    now: Date,
    maxAttempts: number,
    runId?: string
  ): Promise<ClaimedRadarItem[]> {
    const runFilter = runId ? Prisma.sql`AND "lastRunId" = ${runId}::uuid` : Prisma.empty;
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
          ${runFilter}
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

      return items.map((i) => ({ ...RadarWorkRepository.toSnapshot(i), leaseExpiresAt }));
    });
  }

  async findById(itemId: string): Promise<RadarItem | null> {
    const row = await this.prisma.radarItem.findUnique({ where: { id: itemId }, select: RADAR_ITEM_SELECT });
    return row ? RadarItemMapper.toDomain(row) : null;
  }

  async saveEnrichment(
    item: RadarItem,
    enrichment: RadarEnrichmentInput,
    depth: RadarAnalysisDepth | null = null
  ): Promise<boolean> {
    const { producer, ...fields } = enrichment;
    const { sources, ...rest } = fields;
    const data = {
      ...rest,
      sources: sources as unknown as Prisma.InputJsonValue,
      producerAdapter: producer.adapter,
      producerModel: producer.model,
      analysisDepth: depth,
    };

    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.radarItem.updateMany({
        where: { id: item.id },
        data: {
          ...(RadarItemMapper.toWorkPersistence(item) as Prisma.RadarItemUpdateManyMutationInput),
          workError: null,
        },
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

  async release(itemIds: string[], countAttempt: boolean): Promise<void> {
    if (itemIds.length === 0) return;
    await this.prisma.radarItem.updateMany({
      where: { id: { in: itemIds }, workStatus: RadarWorkStatus.CLAIMED },
      data: {
        workStatus: RadarWorkStatus.PENDING,
        leaseExpiresAt: null,
        ...(countAttempt ? {} : { claimCount: { decrement: 1 } }),
      },
    });
  }

  async markFailed(itemId: string, reason: string, maxAttempts: number): Promise<void> {
    await this.prisma.radarItem.updateMany({
      where: { id: itemId, workStatus: RadarWorkStatus.CLAIMED },
      data: {
        workStatus: RadarWorkStatus.PENDING,
        leaseExpiresAt: null,
        claimCount: maxAttempts,
        workError: reason.slice(0, RadarWorkRepository.MAX_WORK_ERROR),
      },
    });
  }

  async findDeepCandidates(runId: string, minScore: number, limit: number): Promise<RadarWorkSnapshot[]> {
    const items = await this.prisma.radarItem.findMany({
      where: {
        lastRunId: runId,
        workError: null,
        enrichment: { analysisDepth: 'light', signalScore: { gte: minScore } },
      },
      select: claimedSelect,
      orderBy: [{ enrichment: { signalScore: 'desc' } }, { publishedAt: 'desc' }],
      take: limit,
    });
    return items.map(RadarWorkRepository.toSnapshot);
  }

  async findAnalyzed(itemIds: readonly string[]): Promise<RadarWorkSnapshot[]> {
    const items = await this.prisma.radarItem.findMany({
      where: { id: { in: [...itemIds] }, enrichment: { isNot: null } },
      select: claimedSelect,
    });
    return items.map(RadarWorkRepository.toSnapshot);
  }

  countDeep(runId: string): Promise<number> {
    return this.prisma.radarItem.count({ where: { lastRunId: runId, enrichment: { analysisDepth: 'deep' } } });
  }

  async noteError(itemId: string, reason: string): Promise<void> {
    await this.prisma.radarItem.updateMany({
      where: { id: itemId },
      data: { workError: reason.slice(0, RadarWorkRepository.MAX_WORK_ERROR) },
    });
  }

  // --- Private ---

  private static toSnapshot(i: Prisma.RadarItemGetPayload<{ select: typeof claimedSelect }>): RadarWorkSnapshot {
    return {
      ...i,
      media: i.media as unknown as RadarMedia[],
      links: i.links as unknown as RadarLink[],
      sharedPost: i.sharedPost as unknown as RadarSharedPost | null,
      engagement: i.engagement as unknown as RadarEngagement,
      comments: i.comments as unknown as RadarComment[],
    };
  }
}
