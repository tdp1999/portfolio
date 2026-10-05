import { RadarStatus, RadarStep } from '@prisma/client';

import { RADAR_RUN_CANCELLED_MESSAGE } from '@portfolio/shared/types';

import { IRadarRunRepository, RadarRunSnapshot } from '../ports/radar-run.repository.port';
import { CancelRunCommand, CancelRunHandler } from './run.cancel.command';

const RUN_ID = '01a10b5b-9d90-753e-a6a3-000000000001';

const run = (status: RadarStatus, stepStatuses: RadarStatus[]): RadarRunSnapshot =>
  ({
    id: RUN_ID,
    status,
    steps: [RadarStep.CAPTURE, RadarStep.NORMALIZE, RadarStep.ENRICH, RadarStep.ANALYZE].map((step, i) => ({
      step,
      status: stepStatuses[i],
    })),
  }) as unknown as RadarRunSnapshot;

const setup = (found: RadarRunSnapshot | null, failApplies = true) => {
  const runs = {
    findById: jest.fn(async () => found),
    fail: jest.fn(async () => failApplies),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  return { runs, handler: new CancelRunHandler(runs) };
};

const { DONE, RUNNING, PENDING, FAILED, AWAITING_EXTERNAL } = RadarStatus;

describe('CancelRunHandler', () => {
  it('should answer 404 for an unknown run', async () => {
    const { handler } = setup(null);

    await expect(handler.execute(new CancelRunCommand(RUN_ID))).rejects.toMatchObject({
      errorCode: 'RADAR_RUN_NOT_FOUND',
    });
  });

  it('should refuse a run that already ended, and one the tick ended while the cancel was on its way', async () => {
    const cases = [
      setup(run(DONE, [DONE, DONE, DONE, DONE])),
      setup(run(FAILED, [FAILED, PENDING, PENDING, PENDING])),
      setup(run(AWAITING_EXTERNAL, [DONE, DONE, DONE, AWAITING_EXTERNAL]), false),
    ];

    for (const { handler } of cases) {
      await expect(handler.execute(new CancelRunCommand(RUN_ID))).rejects.toMatchObject({
        errorCode: 'RADAR_RUN_FINISHED',
      });
    }
  });

  it('should fail the step the run is on with the cancel message', async () => {
    const { runs, handler } = setup(run(RUNNING, [DONE, RUNNING, PENDING, PENDING]));

    await handler.execute(new CancelRunCommand(RUN_ID));

    expect(runs.fail).toHaveBeenCalledWith(RUN_ID, RadarStep.NORMALIZE, RADAR_RUN_CANCELLED_MESSAGE, expect.any(Date));
  });
});
