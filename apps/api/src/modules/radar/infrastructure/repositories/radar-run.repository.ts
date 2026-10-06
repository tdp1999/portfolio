import { Injectable } from '@nestjs/common';
import { Prisma, RadarStatus, RadarStep, RadarWorkStatus } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import {
  CreateRunData,
  IRadarRunRepository,
  RadarRunItemCounts,
  RadarRunSnapshot,
  RunPatch,
  StepPatch,
} from '../../application/ports/radar-run.repository.port';
import { PrismaService } from '../../../../shared/prisma';
import { stuckWhere } from './radar-item.repository';

const ACTIVE: RadarStatus[] = [RadarStatus.PENDING, RadarStatus.RUNNING, RadarStatus.AWAITING_EXTERNAL];
const STEP_ORDER: RadarStep[] = [
  RadarStep.CAPTURE,
  RadarStep.NORMALIZE,
  RadarStep.ENRICH,
  RadarStep.ANALYZE,
  RadarStep.SYNTHESIZE,
];
// jsonb `@>` containment: matches when any array element carries storageStatus "pending".
const HAS_PENDING = [{ storageStatus: 'pending' }];

const include = {
  source: { select: { url: true, displayName: true } },
  steps: true,
} satisfies Prisma.RadarRunInclude;

type RunRow = Prisma.RadarRunGetPayload<{ include: typeof include }>;

const toSnapshot = (row: RunRow): RadarRunSnapshot => ({
  id: row.id,
  sourceId: row.sourceId,
  sourceUrl: row.source.url,
  sourceName: row.source.displayName,
  flow: row.flow,
  status: row.status,
  windowFrom: row.windowFrom,
  windowTo: row.windowTo,
  itemCap: row.itemCap,
  captureAdapter: row.captureAdapter,
  llmAdapter: row.llmAdapter,
  itemsCaptured: row.itemsCaptured,
  itemsCreated: row.itemsCreated,
  itemsUpdated: row.itemsUpdated,
  itemsFailed: row.itemsFailed,
  fetchComments: row.fetchComments,
  error: row.error,
  warning: row.warning,
  createdAt: row.createdAt,
  startedAt: row.startedAt,
  finishedAt: row.finishedAt,
  steps: [...row.steps]
    .sort((a, b) => STEP_ORDER.indexOf(a.step) - STEP_ORDER.indexOf(b.step))
    .map((s) => ({
      step: s.step,
      status: s.status,
      adapter: s.adapter,
      providerJobRef: s.providerJobRef,
      meta: (s.meta ?? {}) as Record<string, unknown>,
      error: s.error,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
    })),
});

@Injectable()
export class RadarRunRepository implements IRadarRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Locks the source row, so two concurrent creates on one source cannot both see it idle. */
  async create(data: CreateRunData): Promise<RadarRunSnapshot | null> {
    const { steps, ...run } = data;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM radar_sources WHERE id = ${run.sourceId}::uuid FOR UPDATE`;
      if ((await tx.radarRun.count({ where: { sourceId: run.sourceId, status: { in: ACTIVE } } })) > 0) return null;
      const row = await tx.radarRun.create({
        data: { ...run, steps: { create: steps.map((s) => ({ id: uuidv7(), ...s })) } },
        include,
      });
      return toSnapshot(row);
    });
  }

  async findById(id: string): Promise<RadarRunSnapshot | null> {
    const row = await this.prisma.radarRun.findUnique({ where: { id }, include });
    return row ? toSnapshot(row) : null;
  }

  async list(limit: number): Promise<RadarRunSnapshot[]> {
    const rows = await this.prisma.radarRun.findMany({ orderBy: { createdAt: 'desc' }, take: limit, include });
    return rows.map(toSnapshot);
  }

  async findActiveIds(): Promise<string[]> {
    const rows = await this.prisma.radarRun.findMany({
      where: { status: { in: ACTIVE } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => r.id);
  }

  async hasActiveRun(sourceId: string): Promise<boolean> {
    return (await this.prisma.radarRun.count({ where: { sourceId, status: { in: ACTIVE } } })) > 0;
  }

  /** Conditional on the run still being active, so a cancelled or finished run is never revived. */
  async updateRun(runId: string, patch: RunPatch): Promise<boolean> {
    const { count } = await this.prisma.radarRun.updateMany({
      where: { id: runId, status: { in: ACTIVE } },
      data: patch,
    });
    return count > 0;
  }

  async updateStep(runId: string, step: RadarStep, patch: StepPatch): Promise<boolean> {
    const { meta, ...rest } = patch;
    const { count } = await this.prisma.radarStepRun.updateMany({
      where: { runId, step, run: { status: { in: ACTIVE } } },
      data: { ...rest, ...(meta ? { meta: meta as Prisma.InputJsonValue } : {}) },
    });
    return count > 0;
  }

  async completeUpload(runId: string, startedAt: Date, at: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.radarStepRun.updateMany({
        where: {
          runId,
          step: RadarStep.CAPTURE,
          status: RadarStatus.AWAITING_EXTERNAL,
          run: { status: { in: ACTIVE } },
        },
        data: { status: RadarStatus.DONE, startedAt, finishedAt: at },
      });
      if (count === 0) return false;
      const step = (s: RadarStep, data: Prisma.RadarStepRunUpdateInput) =>
        tx.radarStepRun.update({ where: { runId_step: { runId, step: s } }, data });
      await step(RadarStep.NORMALIZE, { status: RadarStatus.DONE, startedAt, finishedAt: at });
      await step(RadarStep.ENRICH, { status: RadarStatus.RUNNING, startedAt: at });
      await tx.radarRun.update({ where: { id: runId }, data: { status: RadarStatus.RUNNING, startedAt } });
      return true;
    });
  }

  async fail(runId: string, step: RadarStep, message: string, at: Date): Promise<boolean> {
    const error = message.slice(0, 2000);
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.radarRun.updateMany({
        where: { id: runId, status: { in: ACTIVE } },
        data: { status: RadarStatus.FAILED, error, finishedAt: at },
      });
      if (count === 0) return false;
      await tx.radarStepRun.update({
        where: { runId_step: { runId, step } },
        data: { status: RadarStatus.FAILED, error, finishedAt: at },
      });
      return true;
    });
  }

  async countItems(runId: string, now: Date, maxAttempts: number): Promise<RadarRunItemCounts> {
    const where = { lastRunId: runId } satisfies Prisma.RadarItemWhereInput;
    const [total, notAnalyzed, withPendingImages] = await Promise.all([
      this.prisma.radarItem.count({ where }),
      // The Feed's `pending` bucket: stuck items and items of a paused source never block a run.
      this.prisma.radarItem.count({
        where: {
          ...where,
          workStatus: { not: RadarWorkStatus.DONE },
          source: { isActive: true },
          NOT: stuckWhere(now, maxAttempts),
        },
      }),
      this.prisma.radarItem.count({
        where: {
          ...where,
          OR: [
            { media: { array_contains: HAS_PENDING } },
            { sharedPost: { path: ['media'], array_contains: HAS_PENDING } },
          ],
        },
      }),
    ]);
    return { total, notAnalyzed, withPendingImages };
  }
}
