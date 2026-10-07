import { CommandBus } from '@nestjs/cqrs';

import { WriteAutoBriefCommand } from '../commands/brief.write.command';
import { AdvanceRunCommand } from '../commands/run.advance.command';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { RadarTickJob } from './radar-tick.job';

const setup = (activeIds: string[]) => {
  const runs = { findActiveIds: jest.fn(async () => activeIds) } as unknown as jest.Mocked<IRadarRunRepository>;
  const commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
  const sent = (type: abstract new (...args: never[]) => unknown) =>
    commandBus.execute.mock.calls.filter(([command]) => command instanceof type).length;
  return { runs, commandBus, sent, job: new RadarTickJob(runs, commandBus) };
};
const pending = () => {
  let release!: () => void;
  return { promise: new Promise<void>((resolve) => (release = resolve)), release: () => release() };
};

describe('RadarTickJob', () => {
  it('should run one query and advance nothing when no run is active', async () => {
    const { runs, sent, job } = setup([]);

    await job.tick();

    expect(runs.findActiveIds).toHaveBeenCalledTimes(1);
    expect(sent(AdvanceRunCommand)).toBe(0);
  });

  it('should exit at once when a tick starts while the previous one is still running', async () => {
    const { runs, commandBus, sent, job } = setup(['run-1']);
    const slow = pending();
    commandBus.execute.mockReturnValue(slow.promise);

    const first = job.tick();
    await job.tick();
    slow.release();
    await first;

    expect(runs.findActiveIds).toHaveBeenCalledTimes(1);
    expect(sent(AdvanceRunCommand)).toBe(1);
    expect(sent(WriteAutoBriefCommand)).toBe(1);
  });

  it('should keep advancing runs while a brief is still being written', async () => {
    const { commandBus, sent, job } = setup(['run-1']);
    const brief = pending();
    commandBus.execute.mockImplementation(async (command) =>
      command instanceof WriteAutoBriefCommand ? brief.promise : undefined
    );

    await job.tick();
    await job.tick();
    brief.release();

    expect(sent(AdvanceRunCommand)).toBe(2);
    expect(sent(WriteAutoBriefCommand)).toBe(1);
  });
});
