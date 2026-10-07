import { Injectable } from '@nestjs/common';
import { Prisma, RadarTranscriptStatus } from '@prisma/client';

import { IRadarTranscriptRepository } from '../../application/ports/radar-transcript.repository.port';
import { RadarTranscriptJob, RadarTranscriptResult } from '../../domain/radar-transcript.types';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarTranscriptRepository implements IRadarTranscriptRepository {
  /** The column's length. */
  private static readonly MAX_ERROR = 500;

  constructor(private readonly prisma: PrismaService) {}

  async findWaiting(runId: string, limit: number): Promise<RadarTranscriptJob[]> {
    const rows = await this.prisma.radarItem.findMany({
      where: RadarTranscriptRepository.waiting(runId),
      select: { id: true, videoUrl: true, videoDurationSec: true, transcriptAttempts: true },
      orderBy: { publishedAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({
      itemId: r.id,
      videoUrl: r.videoUrl as string,
      durationSec: r.videoDurationSec,
      attempts: r.transcriptAttempts,
    }));
  }

  countWaiting(runId: string): Promise<number> {
    return this.prisma.radarItem.count({ where: RadarTranscriptRepository.waiting(runId) });
  }

  async save(itemId: string, result: RadarTranscriptResult): Promise<void> {
    const data: Prisma.RadarItemUpdateManyMutationInput =
      result.status === 'DONE'
        ? {
            transcriptStatus: RadarTranscriptStatus.DONE,
            transcript: result.transcript as unknown as Prisma.InputJsonValue,
            transcriptError: null,
          }
        : result.status === 'PENDING'
          ? { transcriptStatus: RadarTranscriptStatus.PENDING, transcriptAttempts: result.attempts }
          : {
              transcriptStatus: RadarTranscriptStatus.FAILED,
              transcriptError: result.error.slice(0, RadarTranscriptRepository.MAX_ERROR),
              transcriptAttempts: result.attempts,
            };
    await this.prisma.radarItem.updateMany({ where: { id: itemId }, data });
  }

  // --- Private ---

  /** Items of a paused source are skipped by the analysis too, so they do not hold ENRICH open. */
  private static waiting(runId: string): Prisma.RadarItemWhereInput {
    return {
      lastRunId: runId,
      videoUrl: { not: null },
      transcriptStatus: { in: [RadarTranscriptStatus.NONE, RadarTranscriptStatus.PENDING] },
      source: { isActive: true },
    };
  }
}
