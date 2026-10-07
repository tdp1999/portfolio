import type { IAiClient } from '../../../ai';
import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateBriefCommand, CreateBriefHandler } from './brief.create.command';

const WINDOW = { windowFrom: '2026-09-01T00:00:00Z', windowTo: '2026-09-30T23:59:59Z' };

describe('CreateBriefHandler', () => {
  const setup = (configured: boolean) => {
    const briefs = {
      windowItemIds: jest.fn(async () => ['01a10b5b-9d90-753e-a6a3-0000000000a1']),
      hasWaiting: jest.fn(async () => false),
      add: jest.fn(),
    } as unknown as jest.Mocked<IRadarBriefRepository>;
    const handler = new CreateBriefHandler(briefs, {} as IRadarSourceRepository, { configured } as IAiClient);
    return { briefs, handler };
  };

  it('should refuse an AUTO brief (the default) when the server has no AI key', async () => {
    const { briefs, handler } = setup(false);

    await expect(handler.execute(new CreateBriefCommand(WINDOW))).rejects.toMatchObject({
      errorCode: 'RADAR_AI_NOT_CONFIGURED',
    });
    expect(briefs.add).not.toHaveBeenCalled();
  });

  it('should still accept a WORKER brief without an AI key', async () => {
    const { briefs, handler } = setup(false);

    await expect(handler.execute(new CreateBriefCommand({ ...WINDOW, writer: 'WORKER' }))).resolves.toMatchObject({
      writer: 'WORKER',
    });
    expect(briefs.add).toHaveBeenCalled();
  });
});
