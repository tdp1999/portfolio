import { Injectable } from '@nestjs/common';
import { Prisma, RadarStatus, RadarWorkStatus } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

import { CommonErrorCode, ErrorLayer, InternalServerError } from '@portfolio/shared/errors';

import { IRadarRunRepository, RadarRunItemCounts } from '../../application/ports/radar-run.repository.port';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RADAR_RUN_INCLUDE, RadarRunMapper } from '../mapper/radar-run.mapper';
import { PrismaService } from '../../../../shared/prisma';
import { stuckWhere } from './radar-item.repository';

const ACTIVE: RadarStatus[] = [...RadarRun.ACTIVE];
// jsonb `@>` containment: matches when any array element carries storageStatus "pending".
const HAS_PENDING = [{ storageStatus: 'pending' }];

/** Thrown inside the save transaction to roll it back when a guard does not hold. */
class StaleRunError extends Error {}

@Injectable()
export class RadarRunRepository implements IRadarRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Locks the source row, so two concurrent creates on one source cannot both see it idle. */
  async add(run: RadarRun): Promise<RadarRun | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM radar_sources WHERE id = ${run.sourceId}::uuid FOR UPDATE`;
      if ((await tx.radarRun.count({ where: { sourceId: run.sourceId, status: { in: ACTIVE } } })) > 0) return null;
      const row = await tx.radarRun.create({
        data: {
          ...RadarRunMapper.toPersistence(run),
          steps: { create: run.toProps().steps.map((s) => RadarRunMapper.toStepPersistence(uuidv7(), s)) },
        },
        include: RADAR_RUN_INCLUDE,
      });
      return RadarRunMapper.toDomain(row);
    });
  }

  async findById(id: string): Promise<RadarRun | null> {
    const row = await this.prisma.radarRun.findUnique({ where: { id }, include: RADAR_RUN_INCLUDE });
    return row ? RadarRunMapper.toDomain(row) : null;
  }

  async list(limit: number): Promise<RadarRun[]> {
    const rows = await this.prisma.radarRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: RADAR_RUN_INCLUDE,
    });
    return rows.map((row) => RadarRunMapper.toDomain(row));
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

  /**
   * The run row is updated first, guarded by the active status: that also locks it, so a cancel
   * waits for this transaction or this one sees the cancel. Each changed step is guarded by the
   * status it was read with.
   */
  async save(run: RadarRun): Promise<RadarRun | null> {
    const loaded = run.loadedProps;
    if (!loaded) {
      throw InternalServerError(`Radar run ${run.id} was never added; use add()`, {
        errorCode: CommonErrorCode.INTERNAL_ERROR,
        layer: ErrorLayer.INFRASTRUCTURE,
      });
    }
    const current = run.toProps();
    const changes = RadarRunMapper.changes(loaded, current);

    try {
      await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.radarRun.updateMany({
          where: { id: run.id, status: { in: ACTIVE } },
          data: { ...changes.run, updatedAt: new Date() },
        });
        if (count === 0) throw new StaleRunError();
        for (const step of changes.steps) {
          const updated = await tx.radarStepRun.updateMany({
            where: { runId: run.id, step: step.step, status: step.loadedStatus },
            data: step.data,
          });
          if (updated.count === 0) throw new StaleRunError();
        }
      });
    } catch (error) {
      if (error instanceof StaleRunError) return null;
      throw error;
    }
    return RadarRun.load(current);
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
