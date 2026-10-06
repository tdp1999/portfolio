import { RadarStatus, RadarStep } from '@prisma/client';

import { radarRun, RUN_FIXTURE_ID as RUN_ID } from '../../domain/__fixtures__/radar-run.fixture';
import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarStepMeta } from '../../domain/radar-run.types';
import { ICommentsProvider } from '../ports/comments-provider.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { CancelRunCommand, CancelRunHandler } from './run.cancel.command';

const run = (status: RadarStatus, stepStatuses: RadarStatus[], enrichMeta: RadarStepMeta = {}): RadarRun =>
  radarRun(
    { status },
    Object.fromEntries(
      RadarRun.PIPELINE.map((step, i) => [
        step,
        { status: stepStatuses[i], meta: step === RadarStep.ENRICH ? enrichMeta : {} },
      ])
    )
  );

/** `reread` is what a second read finds after a save that did not apply (the tick moved the run). */
const setup = (found: RadarRun | null, opts: { saveApplies?: boolean; reread?: RadarRun } = {}) => {
  const runs = {
    findById: jest
      .fn()
      .mockResolvedValueOnce(found)
      .mockResolvedValue(opts.reread ?? found),
    save: jest.fn(async (next: RadarRun) => (opts.saveApplies === false ? null : RadarRun.load(next.toProps()))),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const comments = { abort: jest.fn(async () => undefined) } as unknown as jest.Mocked<ICommentsProvider>;
  return { runs, comments, handler: new CancelRunHandler(runs, comments) };
};

const { DONE, RUNNING, PENDING, AWAITING_EXTERNAL } = RadarStatus;

describe('CancelRunHandler', () => {
  it('should answer 404 for an unknown run', async () => {
    const { handler } = setup(null);

    await expect(handler.execute(new CancelRunCommand(RUN_ID))).rejects.toMatchObject({
      errorCode: 'RADAR_RUN_NOT_FOUND',
    });
  });

  it('should refuse a run the tick ended while the cancel was on its way', async () => {
    const { handler } = setup(run(AWAITING_EXTERNAL, [DONE, DONE, DONE, AWAITING_EXTERNAL]), {
      saveApplies: false,
      reread: run(DONE, [DONE, DONE, DONE, DONE]),
    });

    await expect(handler.execute(new CancelRunCommand(RUN_ID))).rejects.toMatchObject({
      errorCode: 'RADAR_RUN_FINISHED',
    });
  });

  it('should give up with RUN_BUSY when every save loses to a tick', async () => {
    const { runs, handler } = setup(run(RUNNING, [DONE, RUNNING, PENDING, PENDING]), { saveApplies: false });

    await expect(handler.execute(new CancelRunCommand(RUN_ID))).rejects.toMatchObject({
      errorCode: 'RADAR_RUN_BUSY',
    });
    expect(runs.save).toHaveBeenCalledTimes(3);
  });

  it('should abort the comments jobs that are still open, and leave settled ones alone', async () => {
    const comments = {
      startedAt: new Date().toISOString(),
      errors: 0,
      done: false,
      jobs: [
        { tier: 'light' as const, itemIds: [], maxChargeUsd: 0.1, jobRef: 'open', done: false },
        { tier: 'full' as const, itemIds: [], maxChargeUsd: 0.4, jobRef: 'settled', done: true },
      ],
    };
    const { comments: provider, handler } = setup(run(RUNNING, [DONE, DONE, RUNNING, PENDING], { comments }));

    await handler.execute(new CancelRunCommand(RUN_ID));

    expect(provider.abort).toHaveBeenCalledTimes(1);
    expect(provider.abort).toHaveBeenCalledWith('open');
  });
});
