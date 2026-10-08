import { RadarBriefWriter, RadarWorkStatus } from '@prisma/client';

import { AiCallError, type IAiClient } from '../../../ai';
import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { IRadarBriefRepository, RadarBriefWorkItem } from '../ports/radar-brief.repository.port';
import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import { loadRadarAnalysisConfig } from '../radar-analysis.config';
import { WriteAutoBriefHandler } from './brief.write.command';

const config = loadRadarAnalysisConfig({});
const [MODEL_1, MODEL_2] = config.brief.models;
const BRIEF_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
const IN = '01a10b5b-9d90-753e-a6a3-0000000000a1';
const OUTSIDE = '01a10b5b-9d90-753e-a6a3-0000000000ff';

const claimed = (createdAt = new Date()) =>
  RadarBrief.load({
    id: BRIEF_ID,
    sourceId: null,
    windowFrom: new Date('2026-09-01T00:00:00Z'),
    windowTo: new Date('2026-09-30T23:59:59.999Z'),
    body: '',
    itemIds: [],
    workStatus: RadarWorkStatus.CLAIMED,
    leaseExpiresAt: new Date(),
    producer: null,
    writer: RadarBriefWriter.AUTO,
    error: null,
    createdAt,
  });
const post = { id: IN, publishedAt: new Date('2026-09-05T00:00:00Z'), signalScore: 8 } as RadarBriefWorkItem;
const answer = (body: string, model = MODEL_1) => ({ data: { body }, model }) as never;
const GOOD = `Tin [Duy, 05/09](/radar/items/${IN}).`;

describe('WriteAutoBriefHandler', () => {
  let ai: jest.Mocked<IAiClient>;
  let briefs: jest.Mocked<IRadarBriefRepository>;
  const handler = () =>
    new WriteAutoBriefHandler(
      ai,
      briefs,
      { findById: jest.fn() } as unknown as IRadarSourceRepository,
      { find: jest.fn(async () => null) } as unknown as IRadarProfileRepository,
      config
    );
  const run = () => handler().execute();
  const saved = () => (briefs.saveResult.mock.calls.at(-1)?.[0] as RadarBrief).toProps();

  beforeEach(() => {
    ai = {
      configured: true,
      provider: 'gemini',
      billing: 'paid',
      generateStructured: jest.fn(),
      spentMicroUsd: jest.fn(),
      spentByGroup: jest.fn(),
      spendByFeature: jest.fn(),
    };
    briefs = {
      claim: jest.fn(async () => claimed()),
      release: jest.fn(),
      saveResult: jest.fn(async () => true),
      windowItems: jest.fn(async () => ({ items: [post], total: 1 })),
    } as unknown as jest.Mocked<IRadarBriefRepository>;
  });

  it('should claim only AUTO briefs and do nothing when none waits', async () => {
    briefs.claim.mockResolvedValue(null);

    await expect(run()).resolves.toBe('idle');
    expect(briefs.claim).toHaveBeenCalledWith(RadarBriefWriter.AUTO, expect.any(Date), expect.any(Date));
  });

  it('should store a valid body as written by the provider and the model that answered', async () => {
    ai.generateStructured.mockResolvedValue(answer(GOOD));

    await expect(run()).resolves.toBe('written');
    expect(ai.generateStructured).toHaveBeenCalledWith(expect.objectContaining({ feature: 'radar.brief', tools: [] }));
    expect(saved()).toMatchObject({
      workStatus: RadarWorkStatus.DONE,
      body: GOOD,
      itemIds: [IN],
      producer: { adapter: 'gemini', model: MODEL_1 },
    });
  });

  it('should retry a body linking outside the window once, naming the bad ids, then fail the brief', async () => {
    ai.generateStructured.mockResolvedValue(answer(`Tin [x](/radar/items/${OUTSIDE}).`));

    await expect(run()).resolves.toBe('failed');
    expect(ai.generateStructured).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(ai.generateStructured.mock.calls[1][0].parts)).toContain(OUTSIDE);
    expect(saved()).toMatchObject({
      workStatus: RadarWorkStatus.DONE,
      body: '',
      error: expect.stringContaining('Invalid brief'),
    });
  });

  it('should accept the retried body when it fixes the links', async () => {
    ai.generateStructured.mockResolvedValueOnce(answer('Không có link.')).mockResolvedValueOnce(answer(GOOD));

    await expect(run()).resolves.toBe('written');
  });

  it('should hand a busy model over to the next one', async () => {
    ai.generateStructured
      .mockRejectedValueOnce(new AiCallError('rate-limited', '429'))
      .mockResolvedValueOnce(answer(GOOD, MODEL_2));

    await expect(run()).resolves.toBe('written');
    expect(ai.generateStructured.mock.calls[1][0].model).toBe(MODEL_2);
  });

  it.each([
    ['every model is busy', new AiCallError('rate-limited', '429')],
    ['the daily cap is reached', new AiCallError('over-budget', 'cap')],
  ])('should put the brief back to pending when %s', async (_, error) => {
    ai.generateStructured.mockRejectedValue(error);

    await expect(run()).resolves.toBe('busy');
    expect(briefs.release).toHaveBeenCalledWith(BRIEF_ID);
    expect(briefs.saveResult).not.toHaveBeenCalled();
  });

  it('should give the brief up after an hour of busy models, so a new brief can be requested', async () => {
    briefs.claim.mockResolvedValue(claimed(new Date(Date.now() - 61 * 60_000)));
    ai.generateStructured.mockRejectedValue(new AiCallError('rate-limited', '429'));

    await expect(run()).resolves.toBe('failed');
    expect(briefs.release).not.toHaveBeenCalled();
    expect(saved()).toMatchObject({ workStatus: RadarWorkStatus.DONE, error: expect.stringContaining('Gave up') });
  });

  it('should fail a waiting brief at once when the server has no AI key', async () => {
    Object.assign(ai, { configured: false });

    await expect(run()).resolves.toBe('failed');
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(saved()).toMatchObject({ error: expect.stringContaining('not configured') });
  });

  it('should fail the brief when its window has no analyzed post anymore', async () => {
    briefs.windowItems.mockResolvedValue({ items: [], total: 0 });

    await expect(run()).resolves.toBe('failed');
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it('should fail the brief with the reason when the key is rejected', async () => {
    ai.generateStructured.mockRejectedValue(new AiCallError('auth', 'API key invalid'));

    await expect(run()).resolves.toBe('failed');
    expect(saved()).toMatchObject({ error: 'API key invalid' });
  });
});
