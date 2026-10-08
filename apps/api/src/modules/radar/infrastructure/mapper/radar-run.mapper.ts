import { Prisma, RadarStatus, RadarStep } from '@prisma/client';

import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarRunProps, RadarStepMeta, RadarStepRunProps } from '../../domain/radar-run.types';

export const RADAR_RUN_INCLUDE = {
  source: { select: { url: true, displayName: true } },
  steps: true,
} satisfies Prisma.RadarRunInclude;

export type RadarRunRow = Prisma.RadarRunGetPayload<{ include: typeof RADAR_RUN_INCLUDE }>;

/** What `save` writes: the run fields that changed, and each changed step with the status it was read in. */
export interface RadarRunChanges {
  run: Prisma.RadarRunUpdateManyMutationInput;
  steps: { step: RadarStep; loadedStatus: RadarStatus; data: Prisma.RadarStepRunUpdateManyMutationInput }[];
}

const RUN_FIELDS = ['status', 'error', 'warning', 'startedAt', 'finishedAt'] as const;
const STEP_FIELDS = ['status', 'providerJobRef', 'meta', 'error', 'startedAt', 'finishedAt'] as const;

export class RadarRunMapper {
  static toDomain(row: RadarRunRow): RadarRun {
    return RadarRun.load({
      id: row.id,
      kind: row.kind,
      sourceId: row.sourceId,
      sourceUrl: row.source?.url ?? null,
      sourceName: row.source?.displayName ?? null,
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
      budgetMicroUsd: row.budgetMicroUsd,
      error: row.error,
      warning: row.warning,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      steps: [...row.steps]
        .sort((a, b) => RadarRunMapper.order(a.step) - RadarRunMapper.order(b.step))
        .map((s) => ({
          step: s.step,
          status: s.status,
          adapter: s.adapter,
          providerJobRef: s.providerJobRef,
          meta: (s.meta ?? {}) as RadarStepMeta,
          error: s.error,
          startedAt: s.startedAt,
          finishedAt: s.finishedAt,
        })),
    });
  }

  /** A new run, without its steps (created by the repository with their own ids). */
  static toPersistence(run: RadarRun): Prisma.RadarRunUncheckedCreateWithoutStepsInput {
    return {
      id: run.id,
      kind: run.kind,
      sourceId: run.sourceId,
      flow: run.flow,
      status: run.status,
      windowFrom: run.windowFrom,
      windowTo: run.windowTo,
      itemCap: run.itemCap,
      captureAdapter: run.captureAdapter,
      llmAdapter: run.llmAdapter,
      fetchComments: run.fetchComments,
      budgetMicroUsd: run.budgetMicroUsd,
      createdAt: run.createdAt,
    };
  }

  static toStepPersistence(id: string, step: RadarStepRunProps): Prisma.RadarStepRunCreateWithoutRunInput {
    return {
      id,
      step: step.step,
      status: step.status,
      adapter: step.adapter,
      providerJobRef: step.providerJobRef,
      meta: step.meta as Prisma.InputJsonValue,
      error: step.error,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
    };
  }

  static changes(loaded: RadarRunProps, current: RadarRunProps): RadarRunChanges {
    const run: Record<string, unknown> = {};
    for (const field of RUN_FIELDS) {
      if (!RadarRunMapper.same(loaded[field], current[field])) run[field] = current[field];
    }

    const steps: RadarRunChanges['steps'] = [];
    for (const step of current.steps) {
      const before = loaded.steps.find((s) => s.step === step.step);
      if (!before) continue;
      const data: Record<string, unknown> = {};
      for (const field of STEP_FIELDS) {
        if (!RadarRunMapper.same(before[field], step[field])) data[field] = step[field];
      }
      if (Object.keys(data).length > 0) steps.push({ step: step.step, loadedStatus: before.status, data });
    }
    return { run, steps };
  }

  // --- Private ---

  private static order(step: RadarStep): number {
    const index = RadarRun.PIPELINE.indexOf(step);
    return index === -1 ? RadarRun.PIPELINE.length : index;
  }

  private static same(a: unknown, b: unknown): boolean {
    if (a instanceof Date || b instanceof Date) {
      return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
    }
    if (typeof a === 'object' && a !== null) return JSON.stringify(a) === JSON.stringify(b);
    return a === b;
  }
}
