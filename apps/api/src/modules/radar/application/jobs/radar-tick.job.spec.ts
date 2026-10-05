import { CommandBus } from '@nestjs/cqrs';

import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RadarTickJob } from './radar-tick.job';

const setup = (activeIds: string[]) => {
  const runs = { findActiveIds: jest.fn(async () => activeIds) } as unknown as jest.Mocked<IRadarRunRepository>;
  const commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
  return { runs, commandBus, job: new RadarTickJob(runs, commandBus) };
};

describe('RadarTickJob', () => {
  it('should run one query and dispatch nothing when no run is active', async () => {
    const { runs, commandBus, job } = setup([]);

    await job.tick();

    expect(runs.findActiveIds).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should exit at once when a tick starts while the previous one is still running', async () => {
    const { runs, commandBus, job } = setup(['run-1']);
    let release!: () => void;
    commandBus.execute.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));

    const first = job.tick();
    await job.tick();
    release();
    await first;

    expect(runs.findActiveIds).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });
});
