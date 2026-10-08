import { RadarRunFlow, RadarRunKind, RadarStatus, RadarStep } from '@prisma/client';

import { RadarRun } from '../entities/radar-run.entity';
import { RadarRunProps, RadarStepRunProps } from '../radar-run.types';

export const RUN_FIXTURE_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
export const RUN_FIXTURE_SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';

/** A loaded run on the four pipeline steps, all PENDING unless overridden. For specs only. */
export function radarRunProps(
  over: Partial<Omit<RadarRunProps, 'steps'>> = {},
  steps: Partial<Record<RadarStep, Partial<RadarStepRunProps>>> = {}
): RadarRunProps {
  const flow = over.flow ?? RadarRunFlow.HYBRID;
  const at = new Date('2026-10-05T10:00:00Z');
  return {
    id: RUN_FIXTURE_ID,
    kind: RadarRunKind.CAPTURE,
    sourceId: RUN_FIXTURE_SOURCE_ID,
    sourceUrl: 'https://www.facebook.com/mrgoonie',
    sourceName: 'mrgoonie',
    flow,
    status: RadarStatus.RUNNING,
    windowFrom: null,
    windowTo: null,
    itemCap: 300,
    captureAdapter: flow === RadarRunFlow.MANUAL ? 'upload' : 'apify',
    llmAdapter: flow === RadarRunFlow.AUTO ? 'server-ai' : 'external-worker',
    itemsCaptured: 0,
    itemsCreated: 0,
    itemsUpdated: 0,
    itemsFailed: 0,
    fetchComments: false,
    budgetMicroUsd: flow === RadarRunFlow.AUTO ? 500_000 : null,
    error: null,
    warning: null,
    createdAt: at,
    startedAt: at,
    finishedAt: null,
    ...over,
    steps: RadarRun.PIPELINE.map((step) => ({
      step,
      status: RadarStatus.PENDING,
      adapter: 'x',
      providerJobRef: null,
      meta: {},
      error: null,
      startedAt: null,
      finishedAt: null,
      ...steps[step],
    })),
  };
}

export const radarRun = (...args: Parameters<typeof radarRunProps>) => RadarRun.load(radarRunProps(...args));
