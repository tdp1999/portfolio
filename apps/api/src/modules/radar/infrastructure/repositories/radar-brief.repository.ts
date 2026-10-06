import { Injectable } from '@nestjs/common';
import { Prisma, RadarWorkStatus } from '@prisma/client';

import {
  IRadarBriefRepository,
  RadarBriefScope,
  RadarBriefSummary,
  RadarBriefWorkItem,
} from '../../application/ports/radar-brief.repository.port';
import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { RadarBriefMapper } from '../mapper/radar-brief.mapper';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarBriefRepository implements IRadarBriefRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(brief: RadarBrief): Promise<void> {
    await this.prisma.radarBrief.create({ data: RadarBriefMapper.toPersistence(brief) });
  }

  async findById(id: string): Promise<RadarBrief | null> {
    const row = await this.prisma.radarBrief.findUnique({ where: { id } });
    return row ? RadarBriefMapper.toDomain(row) : null;
  }

  async list(limit: number): Promise<RadarBriefSummary[]> {
    const rows = await this.prisma.radarBrief.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      omit: { body: true },
      include: { source: { select: { displayName: true } } },
    });
    return rows.map(({ itemIds, producerAdapter, producerModel, source, updatedAt: _, ...row }) => ({
      ...row,
      itemCount: itemIds.length,
      sourceName: source?.displayName ?? null,
      producer: producerAdapter && producerModel ? { adapter: producerAdapter, model: producerModel } : null,
    }));
  }

  async hasWaiting(): Promise<boolean> {
    const count = await this.prisma.radarBrief.count({ where: { workStatus: { not: RadarWorkStatus.DONE } } });
    return count > 0;
  }

  async claim(leaseExpiresAt: Date, now: Date): Promise<RadarBrief | null> {
    return this.prisma.$transaction(async (tx) => {
      // Same shape as the item claim: SKIP LOCKED so two workers never leave with the same brief,
      // and the ISO cast keeps the lease comparison independent of the session time zone.
      const [picked] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM radar_briefs
        WHERE "workStatus" = 'PENDING'
           OR ("workStatus" = 'CLAIMED' AND "leaseExpiresAt" < ${now.toISOString()}::timestamp(3))
        ORDER BY "createdAt"
        LIMIT 1
        FOR UPDATE SKIP LOCKED`;
      if (!picked) return null;

      const row = await tx.radarBrief.update({
        where: { id: picked.id },
        data: { workStatus: RadarWorkStatus.CLAIMED, leaseExpiresAt },
      });
      return RadarBriefMapper.toDomain(row);
    });
  }

  async saveResult(brief: RadarBrief): Promise<boolean> {
    const { count } = await this.prisma.radarBrief.updateMany({
      where: { id: brief.id, workStatus: RadarWorkStatus.CLAIMED },
      data: RadarBriefMapper.toResultPersistence(brief),
    });
    return count > 0;
  }

  async windowItemIds(scope: RadarBriefScope): Promise<string[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: RadarBriefRepository.inWindow(scope),
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async windowItems(
    scope: RadarBriefScope,
    offset: number,
    limit: number
  ): Promise<{ items: RadarBriefWorkItem[]; total: number }> {
    const where = RadarBriefRepository.inWindow(scope);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.radarItem.findMany({
        where,
        orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
        skip: offset,
        take: limit,
        select: {
          id: true,
          permalink: true,
          authorName: true,
          publishedAt: true,
          text: true,
          source: { select: { displayName: true } },
          enrichment: true,
        },
      }),
      this.prisma.radarItem.count({ where }),
    ]);
    const items = rows.flatMap(({ source, enrichment: e, ...item }) =>
      e
        ? [
            {
              ...item,
              sourceName: source.displayName,
              tldr: e.tldr,
              providerTags: e.providerTags,
              contentType: e.contentType,
              signalScore: e.signalScore,
              isPromo: e.isPromo,
              isRelevant: e.isRelevant,
              overview: e.overview,
              context: e.context,
              scoreReason: e.scoreReason,
              factCheck: e.factCheck,
              applyNote: e.applyNote,
              linkSummaries: e.linkSummaries as unknown as RadarBriefWorkItem['linkSummaries'],
            },
          ]
        : []
    );
    return { items, total };
  }

  // --- Private ---

  /** Analyzed posts published in the window (both ends included), of one source or all. */
  private static inWindow(scope: RadarBriefScope): Prisma.RadarItemWhereInput {
    return {
      enrichment: { isNot: null },
      publishedAt: { gte: scope.windowFrom, lte: scope.windowTo },
      ...(scope.sourceId && { sourceId: scope.sourceId }),
    };
  }
}
