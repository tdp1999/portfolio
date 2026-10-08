import { RadarRunFlow, RadarStep } from '@prisma/client';

import type { IAiClient } from '../../../ai';
import { radarRunProps } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { GetRunHandler, GetRunQuery, ListRunsHandler } from './run.queries';

const AUTO_ID = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const IDLE_AUTO_ID = '01a10b5b-9d90-753e-a6a3-0000000000a2';
const HYBRID_ID = '01a10b5b-9d90-753e-a6a3-0000000000b1';

describe('ListRunsHandler', () => {
  it('should sum the spend of every AUTO run in one call, 0 for one with no calls, and none for other flows', async () => {
    const runs = {
      list: jest.fn(async () => [
        RadarRun.load(radarRunProps({ id: AUTO_ID, flow: RadarRunFlow.AUTO })),
        RadarRun.load(radarRunProps({ id: IDLE_AUTO_ID, flow: RadarRunFlow.AUTO })),
        RadarRun.load(radarRunProps({ id: HYBRID_ID, flow: RadarRunFlow.HYBRID })),
      ]),
    } as unknown as IRadarRunRepository;
    const ai = {
      spentByGroup: jest.fn(async () => new Map([[AUTO_ID, 110_129]])),
    } as unknown as jest.Mocked<IAiClient>;

    const result = await new ListRunsHandler(runs, ai).execute();

    expect(ai.spentByGroup).toHaveBeenCalledWith('radar-run', [AUTO_ID, IDLE_AUTO_ID]);
    expect(result.map((r) => r.spentMicroUsd)).toEqual([110_129, 0, null]);
  });
});

describe('GetRunHandler', () => {
  const spend = (feature: string, costMicroUsd: number) => ({
    feature,
    calls: 2,
    failed: 0,
    tokensIn: 100,
    tokensOut: 50,
    costMicroUsd,
    billedMicroUsd: 0,
  });
  const setup = (run: RadarRun) => {
    const runs = { findById: jest.fn(async () => run) } as unknown as IRadarRunRepository;
    const ai = {
      spendByFeature: jest.fn(async () => [spend('radar.analyze.light', 90_000), spend('radar.transcript', 20_000)]),
    } as unknown as jest.Mocked<IAiClient>;
    return { ai, get: () => new GetRunHandler(runs, ai).execute(new GetRunQuery(run.id)) };
  };

  it('should add the capture input, the kept failures and the AUTO spend per feature, with the total as spent', async () => {
    const input = { resultsLimit: 300 };
    const { ai, get } = setup(
      RadarRun.load(
        radarRunProps(
          { id: AUTO_ID, flow: RadarRunFlow.AUTO },
          {
            [RadarStep.CAPTURE]: { meta: { input } },
            [RadarStep.NORMALIZE]: { meta: { failures: [{ ref: null, reason: 'bad' }], failuresDropped: 3 } },
          }
        )
      )
    );

    const result = await get();

    expect(ai.spendByFeature).toHaveBeenCalledWith({ type: 'radar-run', id: AUTO_ID });
    expect(result.captureInput).toEqual(input);
    expect(result.failures).toEqual({ items: [{ ref: null, reason: 'bad' }], dropped: 3 });
    expect(result.aiSpend?.map((f) => f.feature)).toEqual(['radar.analyze.light', 'radar.transcript']);
    expect(result.spentMicroUsd).toBe(110_000);
  });

  it('should not read the AI ledger for a Hybrid run', async () => {
    const { ai, get } = setup(RadarRun.load(radarRunProps({ id: HYBRID_ID, flow: RadarRunFlow.HYBRID })));

    const result = await get();

    expect(ai.spendByFeature).not.toHaveBeenCalled();
    expect([result.aiSpend, result.spentMicroUsd]).toEqual([null, null]);
  });

  it('should describe a re-analysis run, which has no source and no CAPTURE or NORMALIZE step', async () => {
    const { get } = setup(
      RadarRun.reanalyze({ itemCount: 3, budgetMicroUsd: 500_000, deepAnalysis: false, analyzeAdapter: 'server-ai' })
    );

    const result = await get();

    expect(result.source).toBeNull();
    expect([result.captureInput, result.captureJobRef]).toEqual([null, null]);
    expect(result.failures).toEqual({ items: [], dropped: 0 });
  });
});
