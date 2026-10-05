import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { ICaptureProvider } from '../ports/capture-provider.port';
import { CreateRunData, IRadarRunRepository } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRunCommand, CreateRunHandler } from './run.create.command';

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';

const setup = (opts: { configured?: boolean; active?: boolean } = {}) => {
  const sources = {
    findById: jest.fn(async () => ({ id: SOURCE_ID, isActive: true })),
  } as unknown as IRadarSourceRepository;
  const runs = {
    hasActiveRun: jest.fn(async () => opts.active ?? false),
    create: jest.fn(async (data: CreateRunData) => ({
      ...data,
      sourceUrl: 'u',
      sourceName: 'n',
      itemsCaptured: 0,
      itemsCreated: 0,
      itemsUpdated: 0,
      itemsFailed: 0,
      error: null,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
      steps: data.steps.map((s) => ({
        ...s,
        providerJobRef: null,
        meta: {},
        error: null,
        startedAt: null,
        finishedAt: null,
      })),
    })),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const apify = { name: 'apify', isConfigured: () => opts.configured ?? true } as unknown as ICaptureProvider;
  return { runs, handler: new CreateRunHandler(sources, runs, [apify]) };
};

const body = (flow: RadarRunFlow) => ({ sourceId: SOURCE_ID, flow, itemCap: 50 });

describe('CreateRunHandler', () => {
  it('should refuse a Hybrid run when the capture provider has no token', async () => {
    const { runs, handler } = setup({ configured: false });

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.HYBRID)))).rejects.toMatchObject({
      errorCode: 'RADAR_CAPTURE_NOT_CONFIGURED',
    });
    expect(runs.create).not.toHaveBeenCalled();
  });

  it('should refuse a second run while the source already has an active one', async () => {
    const { runs, handler } = setup({ active: true });

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.MANUAL)))).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'RADAR_RUN_ALREADY_ACTIVE',
    });
    expect(runs.create).not.toHaveBeenCalled();
  });

  it('should refuse when a concurrent request created the run between the check and the insert', async () => {
    const { runs, handler } = setup();
    runs.create.mockResolvedValueOnce(null);

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.MANUAL)))).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'RADAR_RUN_ALREADY_ACTIVE',
    });
  });

  it('should park a Manual run on the upload and queue a Hybrid run for the tick, with four steps each', async () => {
    const { handler } = setup();

    const manual = await handler.execute(new CreateRunCommand(body(RadarRunFlow.MANUAL)));
    const hybrid = await handler.execute(new CreateRunCommand(body(RadarRunFlow.HYBRID)));

    expect(manual.status).toBe(RadarStatus.AWAITING_EXTERNAL);
    expect(manual.steps[0]).toMatchObject({
      step: RadarStep.CAPTURE,
      status: RadarStatus.AWAITING_EXTERNAL,
      adapter: 'upload',
    });
    expect(hybrid.status).toBe(RadarStatus.PENDING);
    expect(hybrid.steps[0]).toMatchObject({ status: RadarStatus.PENDING, adapter: 'apify' });
    expect(hybrid.steps.map((s) => s.step)).toEqual([
      RadarStep.CAPTURE,
      RadarStep.NORMALIZE,
      RadarStep.ENRICH,
      RadarStep.ANALYZE,
    ]);
  });
});
