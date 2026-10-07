import { Injectable } from '@nestjs/common';
import { RadarTrialStatus } from '@prisma/client';

import {
  IRadarTrialRepository,
  RadarTrialRecord,
  RadarTrialResult,
  RadarTrialStart,
} from '../../application/ports/radar-trial.repository.port';
import { RadarEnrichmentData } from '../../application/radar-analyzer';
import { RadarAnalysisDepth } from '../../domain/radar-analysis.types';
import { PrismaService } from '../../../../shared/prisma';

@Injectable()
export class RadarTrialRepository implements IRadarTrialRepository {
  /** The column's length. */
  private static readonly MAX_ERROR = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async start(trials: readonly RadarTrialStart[]): Promise<void> {
    await this.prisma.radarEnrichmentTrial.createMany({ data: [...trials] });
  }

  /** `updateMany`: a trial whose item was deleted meanwhile is gone (cascade), and that is not an error. */
  async finish(id: string, result: RadarTrialResult, now: Date): Promise<void> {
    await this.prisma.radarEnrichmentTrial.updateMany({
      where: { id },
      data: {
        ...result,
        payload: result.payload as object,
        status: RadarTrialStatus.DONE,
        finishedAt: now,
      },
    });
  }

  async fail(id: string, reason: string, now: Date): Promise<void> {
    await this.prisma.radarEnrichmentTrial.updateMany({
      where: { id },
      data: {
        status: RadarTrialStatus.FAILED,
        error: reason.slice(0, RadarTrialRepository.MAX_ERROR),
        finishedAt: now,
      },
    });
  }

  async listByItem(itemId: string): Promise<RadarTrialRecord[]> {
    const rows = await this.prisma.radarEnrichmentTrial.findMany({ where: { itemId }, orderBy: { createdAt: 'desc' } });
    return rows.map((r) => ({
      ...r,
      depth: r.depth as RadarAnalysisDepth,
      payload: r.payload as RadarEnrichmentData | null,
    }));
  }
}
