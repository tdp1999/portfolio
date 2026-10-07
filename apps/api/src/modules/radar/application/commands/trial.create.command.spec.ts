import { RadarCommentsStatus, RadarItemKind } from '@prisma/client';

import { AiCallError, type IAiClient } from '../../../ai';
import { IRadarProfileRepository } from '../ports/radar-profile.repository.port';
import { IRadarTrialRepository } from '../ports/radar-trial.repository.port';
import { IRadarWorkRepository, RadarWorkSnapshot } from '../ports/radar-work.repository.port';
import { RadarAnalysisAnswer } from '../prompts/radar-analysis.prompt';
import { loadRadarAnalysisConfig } from '../radar-analysis.config';
import { CreateTrialsCommand, CreateTrialsHandler } from './trial.create.command';

const config = loadRadarAnalysisConfig({});

const answer: RadarAnalysisAnswer = {
  tldr: 'Anthropic ra model mới',
  providerTags: ['anthropic'],
  contentType: 'news',
  signalScore: 8,
  isPromo: false,
  isRelevant: true,
  imageNotes: null,
  linkSummaries: [],
  commentDigest: null,
  wantsComments: false,
  factCheck: null,
  factCheckSeverity: null,
  overview: 'Tổng quan',
  context: '- Claude: model của Anthropic',
  scoreReason: 'Tin lớn',
  applyNote: 'Thử ngay',
  sources: [],
};

const snapshot = (n: number): RadarWorkSnapshot => ({
  id: `01a10b5b-9d90-753e-a6a3-00000000010${n}`,
  kind: RadarItemKind.POST,
  permalink: `https://www.facebook.com/p/posts/${n}`,
  authorName: 'Goon',
  publishedAt: new Date('2026-10-01T00:00:00Z'),
  text: 'post',
  media: [],
  links: [],
  sharedPost: null,
  engagement: { likes: 0, comments: 0, shares: 0, views: null },
  comments: [],
  commentsStatus: RadarCommentsStatus.NOT_FETCHED,
  video: null,
});
const usage = { inputTokens: 1000, outputTokens: 200, thinkingTokens: 300, cachedTokens: 0, toolTokens: 50 };
const ok = (model: string) =>
  ({ data: answer, model, usage, costMicroUsd: 4200, latencyMs: 9000, searchQueries: 2 }) as never;

describe('CreateTrialsHandler', () => {
  let ai: jest.Mocked<IAiClient>;
  let work: jest.Mocked<Pick<IRadarWorkRepository, 'findAnalyzed'>>;
  let trials: jest.Mocked<IRadarTrialRepository>;
  let handler: CreateTrialsHandler;

  const run = async (body: unknown) => {
    const result = await handler.execute(new CreateTrialsCommand(body));
    await (handler as unknown as { queue: Promise<void> }).queue;
    return result;
  };

  beforeEach(() => {
    ai = {
      configured: true,
      provider: 'gemini',
      billing: 'paid',
      generateStructured: jest.fn(),
      spentMicroUsd: jest.fn(),
      spentByGroup: jest.fn(),
    };
    work = { findAnalyzed: jest.fn().mockResolvedValue([snapshot(1), snapshot(2)]) };
    trials = { start: jest.fn(), finish: jest.fn(), fail: jest.fn(), listByItem: jest.fn() };
    handler = new CreateTrialsHandler(
      ai,
      work as unknown as IRadarWorkRepository,
      { find: jest.fn(async () => null) } as unknown as IRadarProfileRepository,
      trials,
      config
    );
  });

  it('should refuse when the server has no AI key, before starting anything', async () => {
    Object.assign(ai, { configured: false });

    await expect(run({ itemIds: [snapshot(1).id] })).rejects.toThrow('not configured');
    expect(trials.start).not.toHaveBeenCalled();
  });

  it('should refuse a model with no price, since the daily cap could not count it', async () => {
    await expect(run({ itemIds: [snapshot(1).id], model: 'gemini-9-ultra' })).rejects.toThrow('Unknown model');
    expect(trials.start).not.toHaveBeenCalled();
  });

  it('should skip items with no analysis to compare and start nothing when none is left', async () => {
    work.findAnalyzed.mockResolvedValue([]);

    const result = await run({ itemIds: [snapshot(1).id] });

    expect(result).toEqual({
      started: [],
      skipped: [{ itemId: snapshot(1).id, reason: 'No current analysis to compare with' }],
    });
    expect(trials.start).not.toHaveBeenCalled();
  });

  it('should store an answer with thinking billed as output and tool tokens as input, on the trial feature', async () => {
    work.findAnalyzed.mockResolvedValue([snapshot(1)]);
    ai.generateStructured.mockResolvedValue(ok('gemini-3.5-flash'));

    const result = await run({ itemIds: [snapshot(1).id], model: 'gemini-3.5-flash' });

    expect(result.started).toHaveLength(1);
    expect(ai.generateStructured).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gemini-3.5-flash', feature: 'radar.trial' })
    );
    expect(trials.finish).toHaveBeenCalledWith(
      result.started[0].id,
      expect.objectContaining({ inputTokens: 1050, outputTokens: 500, costMicroUsd: 4200, searchQueries: 2 }),
      expect.any(Date)
    );
  });

  it('should fail one trial with its reason and still run the next', async () => {
    ai.generateStructured
      .mockRejectedValueOnce(new AiCallError('invalid-output', 'tldr: Required'))
      .mockRejectedValueOnce(new AiCallError('invalid-output', 'tldr: Required'))
      .mockResolvedValue(ok('gemini-3.5-flash'));

    const { started } = await run({ itemIds: [snapshot(1).id, snapshot(2).id], model: 'gemini-3.5-flash' });

    expect(trials.fail).toHaveBeenCalledWith(
      started[0].id,
      expect.stringContaining('Invalid answer'),
      expect.any(Date)
    );
    expect(trials.finish).toHaveBeenCalledWith(started[1].id, expect.anything(), expect.any(Date));
  });

  it.each([
    ['the daily cap is reached', new AiCallError('over-budget', 'cap'), 'daily AI spend cap'],
    ['the key is rejected', new AiCallError('auth', 'API key invalid'), 'API key invalid'],
  ])('should fail every remaining trial without calling the provider again when %s', async (_, error, reason) => {
    ai.generateStructured.mockRejectedValue(error);

    const { started } = await run({ itemIds: [snapshot(1).id, snapshot(2).id] });

    expect(ai.generateStructured).toHaveBeenCalledTimes(1);
    for (const { id } of started) {
      expect(trials.fail).toHaveBeenCalledWith(id, expect.stringContaining(reason), expect.any(Date));
    }
    expect(trials.finish).not.toHaveBeenCalled();
  });
});
