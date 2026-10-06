import { Injectable } from '@nestjs/common';
import { Prisma, RadarCommentsStatus } from '@prisma/client';

import {
  IRadarCommentsRepository,
  RadarCommentCandidate,
  SaveCommentsInput,
} from '../../application/ports/radar-comments.repository.port';
import { RadarEngagement, RadarLink, RadarMedia } from '../../domain/radar.types';
import { PrismaService } from '../../../../shared/prisma';

const select = {
  id: true,
  permalink: true,
  authorExternalId: true,
  text: true,
  engagement: true,
  links: true,
  media: true,
  publishedAt: true,
} satisfies Prisma.RadarItemSelect;

type Row = Prisma.RadarItemGetPayload<{ select: typeof select }>;

const toCandidate = (row: Row): RadarCommentCandidate => ({
  ...row,
  engagement: row.engagement as unknown as RadarEngagement,
  links: row.links as unknown as RadarLink[],
  media: row.media as unknown as RadarMedia[],
});

@Injectable()
export class RadarCommentsRepository implements IRadarCommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCandidates(runId: string): Promise<RadarCommentCandidate[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: { lastRunId: runId, commentsStatus: RadarCommentsStatus.NOT_FETCHED },
      select,
      orderBy: { publishedAt: 'desc' },
    });
    return rows.map(toCandidate);
  }

  async findCandidate(itemId: string): Promise<RadarCommentCandidate | null> {
    const row = await this.prisma.radarItem.findUnique({ where: { id: itemId }, select });
    return row ? toCandidate(row) : null;
  }

  async findBySource(sourceId: string): Promise<RadarCommentCandidate[]> {
    const rows = await this.prisma.radarItem.findMany({ where: { sourceId }, select });
    return rows.map(toCandidate);
  }

  async saveComments({ itemId, comments, status, fetchedAt }: SaveCommentsInput): Promise<void> {
    await this.prisma.radarItem.update({
      where: { id: itemId },
      data: {
        comments: comments as unknown as Prisma.InputJsonValue,
        commentsStatus: status,
        commentsFetchedAt: fetchedAt,
        commentsFetchedCount: comments.length,
        commentsError: null,
      },
    });
  }

  async markFailed(itemIds: string[], error: string): Promise<void> {
    if (itemIds.length === 0) return;
    await this.prisma.radarItem.updateMany({
      where: { id: { in: itemIds } },
      data: { commentsStatus: RadarCommentsStatus.FAILED, commentsError: error.slice(0, 500) },
    });
  }
}
