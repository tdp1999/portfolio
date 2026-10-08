import { RadarRunKind, RadarStep } from '@prisma/client';

import type { IAiClient } from '../../../ai';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { SERVER_AI_ADAPTER } from '../ports/llm-provider.port';
import { IRadarItemRepository } from '../ports/radar-item.repository.port';
import { loadRadarAnalysisConfig } from '../radar-analysis.config';
import { ReanalyzeItemsSchema } from '../radar.dto';
import { ReanalyzeItemsCommand, ReanalyzeItemsHandler } from './reanalyze-items.command';

const ID_A = '01a10755-fd0d-700c-af4f-05a7a675700a';
const ID_B = '01a10755-fd0d-700c-af4f-05a7a675700b';
const ID_C = '01a10755-fd0d-700c-af4f-05a7a675700c';

/** The repository requeues `requeued` items and, when given a builder, builds the run from that count. */
const setup = (opts: { requeued?: number; aiConfigured?: boolean } = {}) => {
  const requeued = opts.requeued ?? 2;
  const items = {
    requeueForAnalysis: jest.fn(
      async (_ids: readonly string[], _now: Date, buildRun: ((count: number) => RadarRun) | null) => ({
        requeued,
        run: buildRun && requeued ? buildRun(requeued) : null,
      })
    ),
  } as unknown as jest.Mocked<IRadarItemRepository>;
  const ai = { configured: opts.aiConfigured ?? true } as unknown as IAiClient;
  return { items, handler: new ReanalyzeItemsHandler(items, ai, loadRadarAnalysisConfig({})) };
};

const builtRun = (items: jest.Mocked<IRadarItemRepository>): RadarRun => {
  const buildRun = items.requeueForAnalysis.mock.calls[0][2];
  if (!buildRun) throw new Error('no run builder was passed');
  return buildRun(2);
};

describe('ReanalyzeItemsHandler', () => {
  it('should build an Auto re-analysis run with the server adapter and the asked budget, and report the skipped count', async () => {
    const { items, handler } = setup({ requeued: 2 });

    const result = await handler.execute(
      new ReanalyzeItemsCommand({ ids: [ID_A, ID_B, ID_C], mode: 'AUTO', budgetUsd: 0.5 })
    );

    const run = builtRun(items);
    expect(run.kind).toBe(RadarRunKind.REANALYZE);
    expect(run.budgetMicroUsd).toBe(500_000);
    expect(run.steps.map((s) => [s.step, s.adapter])).toEqual([[RadarStep.ANALYZE, SERVER_AI_ADAPTER]]);
    expect(result).toEqual({ requeued: 2, skipped: 1, runId: expect.any(String) });
  });

  it('should refuse an Auto re-analysis when the server has no AI key, before touching any item', async () => {
    const { items, handler } = setup({ aiConfigured: false });

    await expect(handler.execute(new ReanalyzeItemsCommand({ ids: [ID_A] }))).rejects.toMatchObject({
      errorCode: 'RADAR_AI_NOT_CONFIGURED',
    });
    expect(items.requeueForAnalysis).not.toHaveBeenCalled();
  });

  it('should only requeue for the worker: no run builder and no run id, even with no AI key', async () => {
    const { items, handler } = setup({ aiConfigured: false });

    const result = await handler.execute(new ReanalyzeItemsCommand({ ids: [ID_A, ID_B], mode: 'WORKER' }));

    expect(items.requeueForAnalysis.mock.calls[0][2]).toBeNull();
    expect(result).toEqual({ requeued: 2, skipped: 0, runId: null });
  });

  it('should count a repeated id once, so it is neither requeued twice nor reported as skipped', async () => {
    const { items, handler } = setup({ requeued: 1 });

    const result = await handler.execute(new ReanalyzeItemsCommand({ ids: [ID_A, ID_A], mode: 'WORKER' }));

    expect(items.requeueForAnalysis.mock.calls[0][0]).toEqual([ID_A]);
    expect(result.skipped).toBe(0);
  });
});

describe('ReanalyzeItemsSchema', () => {
  it.each([
    ['no ids', { ids: [] }],
    ['more ids than the cap', { ids: Array.from({ length: 201 }, () => ID_A) }],
    ['a budget on a worker re-analysis', { ids: [ID_A], mode: 'WORKER', budgetUsd: 0.5 }],
  ])('should reject %s', (_, body) => {
    expect(ReanalyzeItemsSchema.safeParse(body).success).toBe(false);
  });

  it('should default the mode to Auto', () => {
    expect(ReanalyzeItemsSchema.parse({ ids: [ID_A] }).mode).toBe('AUTO');
  });
});
