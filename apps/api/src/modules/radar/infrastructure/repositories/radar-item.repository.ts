import { Injectable } from '@nestjs/common';
import { Prisma, RadarTriageStatus, RadarWorkStatus } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import { PaginatedResult, RadarFeedStatus } from '@portfolio/shared/types';

import {
  IRadarItemRepository,
  RadarFeedRow,
  RadarItemDetail,
  RadarItemListFilter,
  RadarQueueStats,
  RadarRequeueResult,
  RadarTriageCounts,
} from '../../application/ports/radar-item.repository.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarEngagement, RadarLink, RadarMedia, RadarSharedPost } from '../../domain/radar.types';
import { RadarComment } from '../../domain/radar-comment.types';
import { PrismaService } from '../../../../shared/prisma';
import { RADAR_VIDEO_SELECT, RadarItemMapper } from '../mapper/radar-item.mapper';
import { RADAR_RUN_INCLUDE, RadarRunMapper } from '../mapper/radar-run.mapper';

const sourceSelect = { select: { id: true, displayName: true, isActive: true, platform: true } } as const;

const feedSelect = {
  id: true,
  kind: true,
  permalink: true,
  authorName: true,
  publishedAt: true,
  text: true,
  media: true,
  workStatus: true,
  claimCount: true,
  leaseExpiresAt: true,
  triageStatus: true,
  engagement: true,
  commentsStatus: true,
  commentsFetchedCount: true,
  commentsFetchedAt: true,
  commentsError: true,
  workError: true,
  videoUrl: true,
  videoDurationSec: true,
  transcriptStatus: true,
  source: sourceSelect,
  enrichment: {
    select: {
      tldr: true,
      providerTags: true,
      contentType: true,
      signalScore: true,
      isPromo: true,
      isRelevant: true,
      wantsComments: true,
      factCheckSeverity: true,
      analysisDepth: true,
      producerAdapter: true,
      producerModel: true,
    },
  },
} as const;

const detailSelect = {
  ...feedSelect,
  lastRunId: true,
  links: true,
  ...RADAR_VIDEO_SELECT,
  sharedPost: true,
  comments: true,
  enrichment: {
    select: {
      ...feedSelect.enrichment.select,
      imageNotes: true,
      linkSummaries: true,
      commentDigest: true,
      factCheck: true,
      applyNote: true,
      context: true,
      scoreReason: true,
      overview: true,
      sources: true,
      updatedAt: true,
    },
  },
} as const;

const notDone = { workStatus: { not: RadarWorkStatus.DONE } } as const;

/** Mirrors the claim query's skip rule: capped, and no live lease the worker could still submit under. */
export const stuckWhere = (now: Date, maxAttempts: number): Prisma.RadarItemWhereInput => ({
  ...notDone,
  claimCount: { gte: maxAttempts },
  OR: [{ leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
  source: { isActive: true },
});

/** The buckets `stats` counts, as filters. `pending` is everything open on an active source that is not stuck. */
const statusWhere = (status: RadarFeedStatus, now: Date, maxAttempts: number): Prisma.RadarItemWhereInput => {
  switch (status) {
    case 'analyzed':
      return { workStatus: RadarWorkStatus.DONE };
    case 'stuck':
      return stuckWhere(now, maxAttempts);
    case 'paused':
      return { ...notDone, source: { isActive: false } };
    case 'pending':
      return { ...notDone, source: { isActive: true }, NOT: stuckWhere(now, maxAttempts) };
  }
};

/** Items a re-analysis may take: no live lease a worker could still submit under, no active run, an active source. */
const requeueableWhere = (ids: readonly string[], now: Date): Prisma.RadarItemWhereInput => ({
  id: { in: [...ids] },
  source: { isActive: true },
  AND: [
    {
      OR: [{ workStatus: { not: RadarWorkStatus.CLAIMED } }, { leaseExpiresAt: null }, { leaseExpiresAt: { lt: now } }],
    },
    { OR: [{ lastRunId: null }, { lastRun: { status: { notIn: [...RadarRun.ACTIVE] } } }] },
  ],
});

const toFilterWhere = (f: RadarItemListFilter, now: Date, maxAttempts: number): Prisma.RadarItemWhereInput => {
  const and: Prisma.RadarItemWhereInput[] = [];
  if (f.status) and.push(statusWhere(f.status, now, maxAttempts));
  if (f.triageStatus) and.push({ triageStatus: f.triageStatus });
  if (f.sourceId) and.push({ sourceId: f.sourceId });
  if (f.producerModel) and.push({ enrichment: { is: { producerModel: f.producerModel } } });
  if (f.runId) and.push({ lastRunId: f.runId });
  if (f.search) {
    const contains = { contains: f.search, mode: 'insensitive' } as const;
    and.push({ OR: [{ text: contains }, { enrichment: { is: { tldr: contains } } }] });
  }
  if (f.providerTag) and.push({ enrichment: { is: { providerTags: { has: f.providerTag } } } });
  if (f.contentType) and.push({ enrichment: { is: { contentType: f.contentType } } });
  if (f.minScore !== undefined) and.push({ enrichment: { is: { signalScore: { gte: f.minScore } } } });
  if (!f.includePromo) and.push({ OR: [{ enrichment: { is: null } }, { enrichment: { is: { isPromo: false } } }] });
  return { AND: and };
};

/** Newest first, then id, breaks every tie so a page boundary never repeats or drops an item. */
const toOrderBy = ({ sortBy, sortDir }: RadarItemListFilter): Prisma.RadarItemOrderByWithRelationInput[] => {
  const tail: Prisma.RadarItemOrderByWithRelationInput[] = [{ publishedAt: 'desc' }, { id: 'desc' }];
  switch (sortBy) {
    case 'signalScore':
      // Prisma has no `nulls: 'last'` on a relation field, and Postgres puts the missing scores of
      // unanalyzed items first on DESC. DONE is the last enum value, so DESC on the status keeps
      // analyzed items on top in both directions.
      return [{ workStatus: 'desc' }, { enrichment: { signalScore: sortDir } }, ...tail];
    case 'source':
      return [{ source: { displayName: sortDir } }, ...tail];
    default:
      return [{ publishedAt: sortDir }, { id: sortDir }];
  }
};

@Injectable()
export class RadarItemRepository implements IRadarItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: RadarItemListFilter, now: Date, maxAttempts: number): Promise<PaginatedResult<RadarFeedRow>> {
    const where = toFilterWhere(filter, now, maxAttempts);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.radarItem.findMany({
        where,
        select: feedSelect,
        orderBy: toOrderBy(filter),
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.radarItem.count({ where }),
    ]);
    return {
      data: data.map((row) => ({
        ...row,
        media: row.media as unknown as RadarMedia[],
        engagement: row.engagement as unknown as RadarEngagement,
      })),
      total,
    };
  }

  async countByTriage(filter: RadarItemListFilter, now: Date, maxAttempts: number): Promise<RadarTriageCounts> {
    const groups = await this.prisma.radarItem.groupBy({
      by: ['triageStatus'],
      where: toFilterWhere({ ...filter, triageStatus: undefined }, now, maxAttempts),
      _count: { _all: true },
    });
    const counts: RadarTriageCounts = { INBOX: 0, SAVED: 0, DONE: 0 };
    for (const g of groups) counts[g.triageStatus] = g._count._all;
    return counts;
  }

  async listProducerModels(): Promise<string[]> {
    const groups = await this.prisma.radarEnrichment.groupBy({
      by: ['producerModel'],
      orderBy: { producerModel: 'asc' },
    });
    return groups.map((g) => g.producerModel);
  }

  async setTriage(ids: readonly string[], status: RadarTriageStatus, now: Date): Promise<number> {
    const { count } = await this.prisma.radarItem.updateMany({
      where: { id: { in: [...ids] } },
      data: { triageStatus: status, triagedAt: now },
    });
    return count;
  }

  async findById(id: string): Promise<RadarItemDetail | null> {
    const item = await this.prisma.radarItem.findUnique({ where: { id }, select: detailSelect });
    if (!item) return null;
    const {
      videoUrl: _videoUrl,
      videoDurationSec: _videoDurationSec,
      transcript: _transcript,
      transcriptStatus: _transcriptStatus,
      transcriptError: _transcriptError,
      ...rest
    } = item;
    return {
      ...rest,
      video: RadarItemMapper.toVideo(item),
      media: item.media as unknown as RadarMedia[],
      links: item.links as unknown as RadarLink[],
      sharedPost: item.sharedPost as unknown as RadarSharedPost | null,
      engagement: item.engagement as unknown as RadarEngagement,
      comments: item.comments as unknown as RadarComment[],
      enrichment: item.enrichment && {
        ...item.enrichment,
        linkSummaries: item.enrichment.linkSummaries as unknown as { url: string; summary: string }[],
        sources: (item.enrichment.sources ?? []) as unknown as { url: string; title: string | null }[],
      },
    };
  }

  async stats(now: Date, maxAttempts: number): Promise<RadarQueueStats> {
    const count = (status: RadarFeedStatus) =>
      this.prisma.radarItem.count({ where: statusWhere(status, now, maxAttempts) });
    const [pending, stuck, paused, analyzed] = await this.prisma.$transaction([
      count('pending'),
      count('stuck'),
      count('paused'),
      count('analyzed'),
    ]);
    return { pending, stuck, paused, analyzed };
  }

  async requeueStuck(now: Date, maxAttempts: number): Promise<number> {
    const { count } = await this.prisma.radarItem.updateMany({
      where: stuckWhere(now, maxAttempts),
      data: { workStatus: RadarWorkStatus.PENDING, claimCount: 0, leaseExpiresAt: null, workError: null },
    });
    return count;
  }

  async requeueForAnalysis(
    ids: readonly string[],
    now: Date,
    buildRun: ((count: number) => RadarRun) | null
  ): Promise<RadarRequeueResult> {
    return this.prisma.$transaction(async (tx) => {
      const where = requeueableWhere(ids, now);
      const eligible = await tx.radarItem.findMany({ where, select: { id: true } });
      if (eligible.length === 0) return { requeued: 0, run: null };

      let run: RadarRun | null = null;
      if (buildRun) {
        const built = buildRun(eligible.length);
        const row = await tx.radarRun.create({
          data: {
            ...RadarRunMapper.toPersistence(built),
            steps: { create: built.toProps().steps.map((s) => RadarRunMapper.toStepPersistence(uuidv7(), s)) },
          },
          include: RADAR_RUN_INCLUDE,
        });
        run = RadarRunMapper.toDomain(row);
      }
      // Same filter again: an item claimed between the read and this write is left alone.
      const { count } = await tx.radarItem.updateMany({
        where: { ...where, id: { in: eligible.map((e) => e.id) } },
        data: {
          workStatus: RadarWorkStatus.PENDING,
          claimCount: 0,
          leaseExpiresAt: null,
          workError: null,
          ...(run ? { lastRunId: run.id } : {}),
        },
      });
      return { requeued: count, run };
    });
  }
}
