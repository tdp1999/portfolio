import { RadarTrialStatus } from '@prisma/client';

import { IRadarTrialRepository, RadarTrialRecord } from '../ports/radar-trial.repository.port';
import { ListItemTrialsHandler, ListItemTrialsQuery } from './trial.queries';

const ITEM_ID = '01a10b5b-9d90-753e-a6a3-000000000101';
const record = (minutesAgo: number, status: RadarTrialStatus): RadarTrialRecord => ({
  id: `01a10b5b-9d90-753e-a6a3-00000000020${minutesAgo}`,
  itemId: ITEM_ID,
  depth: 'deep',
  requestedModel: null,
  status,
  payload: null,
  error: null,
  inputTokens: 0,
  outputTokens: 0,
  costMicroUsd: null,
  searchQueries: 0,
  latencyMs: null,
  createdAt: new Date(Date.now() - minutesAgo * 60_000),
  finishedAt: null,
});

describe('ListItemTrialsHandler', () => {
  it('should show a trial still running after an hour as interrupted, and a recent one as running', async () => {
    const trials = {
      listByItem: jest
        .fn()
        .mockResolvedValue([record(1, RadarTrialStatus.RUNNING), record(61, RadarTrialStatus.RUNNING)]),
    } as unknown as IRadarTrialRepository;

    const [recent, old] = await new ListItemTrialsHandler(trials).execute(new ListItemTrialsQuery(ITEM_ID));

    expect(recent).toMatchObject({ status: 'RUNNING', error: null });
    expect(old).toMatchObject({ status: 'FAILED', error: expect.stringContaining('Interrupted') });
  });
});
