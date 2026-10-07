import { RadarRunFlow } from '@prisma/client';

import type { IAiClient } from '../../../ai';
import { radarRunProps } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { ListRunsHandler } from './run.queries';

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
