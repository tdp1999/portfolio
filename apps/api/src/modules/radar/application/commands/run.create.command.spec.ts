import { RadarRunFlow, RadarStatus, RadarStep } from '@prisma/client';

import { RadarRun } from '../../domain/entities/radar-run.entity';
import { RadarSource } from '../../domain/entities/radar-source.entity';
import { ICaptureProvider } from '../ports/capture-provider.port';
import { IRadarRunRepository } from '../ports/radar-run.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { CreateRunSchema } from '../radar.dto';
import type { IAiClient } from '../../../ai';
import { loadRadarAnalysisConfig } from '../radar-analysis.config';
import { CreateRunCommand, CreateRunHandler } from './run.create.command';

const source = (platform: 'FACEBOOK' | 'YOUTUBE' = 'FACEBOOK') =>
  RadarSource.load({
    id: SOURCE_ID,
    platform,
    url: platform === 'YOUTUBE' ? 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv' : 'https://fb.test/s',
    displayName: 's',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const SOURCE_ID = '01a10755-fd0d-700c-af4f-05a7a675700e';

const setup = (
  opts: { configured?: boolean; active?: boolean; aiConfigured?: boolean; platform?: 'FACEBOOK' | 'YOUTUBE' } = {}
) => {
  const sources = {
    findById: jest.fn(async () => source(opts.platform)),
  } as unknown as IRadarSourceRepository;
  const runs = {
    hasActiveRun: jest.fn(async () => opts.active ?? false),
    add: jest.fn(async (run: RadarRun) => RadarRun.load(run.toProps())),
  } as unknown as jest.Mocked<IRadarRunRepository>;
  const apify = {
    name: 'apify',
    format: 'apify-facebook-posts',
    platform: 'FACEBOOK',
    credentialName: 'APIFY_TOKEN',
    isConfigured: () => opts.configured ?? true,
  } as unknown as ICaptureProvider;
  const youtube = {
    name: 'youtube',
    format: 'youtube-videos',
    platform: 'YOUTUBE',
    credentialName: 'YOUTUBE_API_KEY',
    isConfigured: () => true,
  } as unknown as ICaptureProvider;
  const ai = { configured: opts.aiConfigured ?? true } as unknown as IAiClient;
  return { runs, handler: new CreateRunHandler(sources, runs, [apify, youtube], ai, loadRadarAnalysisConfig({})) };
};

const body = (flow: RadarRunFlow) => ({ sourceId: SOURCE_ID, flow, itemCap: 50 });

describe('CreateRunHandler', () => {
  it('should refuse a Hybrid run when the capture provider has no token', async () => {
    const { runs, handler } = setup({ configured: false });

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.HYBRID)))).rejects.toMatchObject({
      errorCode: 'RADAR_CAPTURE_NOT_CONFIGURED',
    });
    expect(runs.add).not.toHaveBeenCalled();
  });

  it('should refuse a second run while the source already has an active one', async () => {
    const { runs, handler } = setup({ active: true });

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.MANUAL)))).rejects.toMatchObject({
      statusCode: 409,
      errorCode: 'RADAR_RUN_ALREADY_ACTIVE',
    });
    expect(runs.add).not.toHaveBeenCalled();
  });

  it('should refuse when a concurrent request created the run between the check and the insert', async () => {
    const { runs, handler } = setup();
    runs.add.mockResolvedValueOnce(null);

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

  it('should refuse an Auto run while the AI provider has no key', async () => {
    const { runs, handler } = setup({ aiConfigured: false });

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.AUTO)))).rejects.toMatchObject({
      errorCode: 'RADAR_AI_NOT_CONFIGURED',
    });
    expect(runs.add).not.toHaveBeenCalled();
  });

  it('should give an Auto run the server analysis, a budget and the deep flag (the default or the one asked), and other flows none', async () => {
    const { handler } = setup();

    const byDefault = await handler.execute(new CreateRunCommand(body(RadarRunFlow.AUTO)));
    const asked = await handler.execute(
      new CreateRunCommand({ ...body(RadarRunFlow.AUTO), budgetUsd: 0.25, deepAnalysis: true })
    );
    const hybrid = await handler.execute(new CreateRunCommand(body(RadarRunFlow.HYBRID)));

    expect(byDefault.status).toBe(RadarStatus.PENDING);
    expect([byDefault.steps[0].adapter, byDefault.steps[3].adapter]).toEqual(['apify', 'server-ai']);
    expect(byDefault.budgetMicroUsd).toBe(1_000_000);
    expect(asked.budgetMicroUsd).toBe(250_000);
    expect(hybrid.budgetMicroUsd).toBeNull();
    expect([byDefault.deepAnalysis, asked.deepAnalysis]).toEqual([false, true]);
  });

  it('should refuse a Manual run and a comments fetch on a YouTube source', async () => {
    const { runs, handler } = setup({ platform: 'YOUTUBE' });
    const withComments = { ...body(RadarRunFlow.HYBRID), windowFrom: '2026-10-01', fetchComments: true };

    await expect(handler.execute(new CreateRunCommand(body(RadarRunFlow.MANUAL)))).rejects.toMatchObject({
      errorCode: 'RADAR_INVALID_INPUT',
    });
    await expect(handler.execute(new CreateRunCommand(withComments))).rejects.toMatchObject({
      errorCode: 'RADAR_INVALID_INPUT',
    });
    expect(runs.add).not.toHaveBeenCalled();
  });

  it("should capture with the provider of the source's platform", async () => {
    const { handler } = setup({ platform: 'YOUTUBE' });

    const run = await handler.execute(new CreateRunCommand(body(RadarRunFlow.AUTO)));

    expect(run.steps.slice(0, 2).map((s) => s.adapter)).toEqual(['youtube', 'youtube-videos']);
  });
});

describe('CreateRunSchema fetchComments', () => {
  const from = '2026-10-01';

  it.each([
    ['a Hybrid run with a window start', RadarRunFlow.HYBRID, from, true],
    ['a Hybrid backfill (no window start)', RadarRunFlow.HYBRID, undefined, false],
    ['a Manual run', RadarRunFlow.MANUAL, from, false],
  ])('should %s be allowed to fetch comments: %s', (_label, flow, windowFrom, allowed) => {
    const result = CreateRunSchema.safeParse({ ...body(flow), windowFrom, fetchComments: true });

    expect(result.success).toBe(allowed);
  });

  it('should accept a budget on an Auto run only', () => {
    expect(CreateRunSchema.safeParse({ ...body(RadarRunFlow.AUTO), budgetUsd: 2 }).success).toBe(true);
    expect(CreateRunSchema.safeParse({ ...body(RadarRunFlow.HYBRID), budgetUsd: 2 }).success).toBe(false);
  });

  it('should leave deep analysis off unless asked, and accept it on an Auto run only (ADR-036)', () => {
    expect(CreateRunSchema.parse(body(RadarRunFlow.AUTO)).deepAnalysis).toBe(false);
    expect(CreateRunSchema.safeParse({ ...body(RadarRunFlow.AUTO), deepAnalysis: true }).success).toBe(true);
    expect(CreateRunSchema.safeParse({ ...body(RadarRunFlow.HYBRID), deepAnalysis: true }).success).toBe(false);
  });
});
