import { RadarCommentsStatus, RadarItemKind, RadarStep } from '@prisma/client';

import { AiCallError, type IAiClient } from '../../../ai';
import { radarItem } from '../../domain/__fixtures__/radar-item.fixture';
import { RadarLeasePolicy } from '../../domain/policies/radar-lease.policy';
import { IRadarProfileRepository } from '../../application/ports/radar-profile.repository.port';
import { IRadarWorkRepository, RadarWorkSnapshot } from '../../application/ports/radar-work.repository.port';
import { RadarAnalysisAnswer } from '../../application/prompts/radar-analysis.prompt';
import { loadRadarAnalysisConfig } from '../../application/radar-analysis.config';
import { ServerAiAdapter } from './server-ai.adapter';

const RUN_ID = '01a10b5b-9d90-753e-a6a3-000000000001';
const request = { step: RadarStep.ANALYZE, runId: RUN_ID, budgetMicroUsd: 1_000_000 };
const config = loadRadarAnalysisConfig({});
const [LITE_1, LITE_2] = config.light.models;
const [DEEP_1] = config.deep.models;

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
const claimed = (n: number) => ({ ...snapshot(n), leaseExpiresAt: new Date() });
const ok = (model: string, data: unknown = answer) => ({ data, model }) as never;
const ids = (...ns: number[]) => ns.map((n) => snapshot(n).id);

describe('ServerAiAdapter', () => {
  let ai: jest.Mocked<IAiClient>;
  let work: jest.Mocked<IRadarWorkRepository>;
  const adapter = () =>
    new ServerAiAdapter(ai, work, { find: jest.fn(async () => null) } as unknown as IRadarProfileRepository, config);

  beforeEach(() => {
    ai = {
      configured: true,
      provider: 'gemini',
      billing: 'paid',
      generateStructured: jest.fn(),
      spentMicroUsd: jest.fn().mockResolvedValue(0),
      spentByGroup: jest.fn(),
      spendByFeature: jest.fn(),
    };
    work = {
      claim: jest.fn().mockResolvedValue([claimed(1)]),
      findById: jest.fn(async (id: string) => radarItem({ id })),
      saveEnrichment: jest.fn().mockResolvedValue(true),
      release: jest.fn(),
      markFailed: jest.fn(),
      findDeepCandidates: jest.fn().mockResolvedValue([]),
      countDeep: jest.fn().mockResolvedValue(0),
      noteError: jest.fn(),
      findAnalyzed: jest.fn(),
    };
  });

  describe('light pass', () => {
    it('should store the answer as a light analysis produced by the provider and the model that answered', async () => {
      ai.generateStructured.mockResolvedValue(ok(LITE_1));

      await expect(adapter().process(request)).resolves.toEqual({ state: 'working' });

      expect(ai.generateStructured).toHaveBeenCalledWith(
        expect.objectContaining({ model: LITE_1, tools: [], feature: 'radar.analyze.light' })
      );
      expect(work.saveEnrichment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ producer: { adapter: 'gemini', model: LITE_1 } }),
        'light'
      );
    });

    it('should retry an invalid answer once with the reason, then mark the item failed', async () => {
      ai.generateStructured.mockRejectedValue(new AiCallError('invalid-output', 'tldr: Required'));

      await adapter().process(request);

      expect(ai.generateStructured).toHaveBeenCalledTimes(2);
      const retry = ai.generateStructured.mock.calls[1][0];
      expect(JSON.stringify(retry.parts)).toContain('tldr: Required');
      expect(work.markFailed).toHaveBeenCalledWith(
        snapshot(1).id,
        expect.stringContaining('Invalid answer after one retry'),
        RadarLeasePolicy.MAX_CLAIM_ATTEMPTS
      );
    });

    it('should hand a busy model over to the next one in the chain', async () => {
      ai.generateStructured
        .mockRejectedValueOnce(new AiCallError('rate-limited', 'quota'))
        .mockResolvedValueOnce(ok(LITE_2));

      await adapter().process(request);

      expect(ai.generateStructured.mock.calls.map(([r]) => r.model)).toEqual([LITE_1, LITE_2]);
      expect(work.saveEnrichment).toHaveBeenCalled();
    });

    it('should give the rest of the batch back uncounted and stop the tick when every model is busy', async () => {
      work.claim.mockResolvedValue([claimed(1), claimed(2)]);
      ai.generateStructured.mockRejectedValue(new AiCallError('unavailable', '503'));

      await expect(adapter().process(request)).resolves.toEqual({ state: 'working' });

      expect(ai.generateStructured).toHaveBeenCalledTimes(config.light.models.length);
      expect(work.release).toHaveBeenCalledWith(ids(1, 2), false);
      expect(work.markFailed).not.toHaveBeenCalled();
    });

    it('should stop the run once the provider has stayed busy for 30 minutes with no item analyzed', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-07T00:00:00Z') });
      try {
        const busyAdapter = adapter();
        ai.generateStructured.mockRejectedValue(new AiCallError('rate-limited', 'quota'));
        await expect(busyAdapter.process(request)).resolves.toEqual({ state: 'working' });

        jest.setSystemTime(new Date('2026-10-07T00:29:00Z'));
        await expect(busyAdapter.process(request)).resolves.toEqual({ state: 'working' });

        jest.setSystemTime(new Date('2026-10-07T00:30:00Z'));
        await expect(busyAdapter.process(request)).resolves.toEqual({
          state: 'stopped',
          reason: expect.stringContaining('stayed busy'),
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('should restart the busy wait after an item is analyzed', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-07T00:00:00Z') });
      try {
        const busyAdapter = adapter();
        ai.generateStructured.mockRejectedValue(new AiCallError('rate-limited', 'quota'));
        await busyAdapter.process(request);

        jest.setSystemTime(new Date('2026-10-07T00:20:00Z'));
        ai.generateStructured.mockResolvedValueOnce(ok(LITE_1));
        await busyAdapter.process(request);

        jest.setSystemTime(new Date('2026-10-07T00:40:00Z'));
        await expect(busyAdapter.process(request)).resolves.toEqual({ state: 'working' });
      } finally {
        jest.useRealTimers();
      }
    });

    it('should mark the item failed with the last error when every model fails for good', async () => {
      ai.generateStructured.mockRejectedValue(new AiCallError('provider', 'Model not found'));

      await adapter().process(request);

      expect(work.markFailed).toHaveBeenCalledWith(
        snapshot(1).id,
        'Model not found',
        RadarLeasePolicy.MAX_CLAIM_ATTEMPTS
      );
    });

    it('should give the batch back and rethrow when the key is rejected', async () => {
      work.claim.mockResolvedValue([claimed(1), claimed(2)]);
      ai.generateStructured.mockRejectedValue(new AiCallError('auth', 'API key not valid'));

      await expect(adapter().process(request)).rejects.toMatchObject({ kind: 'auth' });
      expect(work.release).toHaveBeenCalledWith(ids(1, 2), false);
    });
  });

  describe('deep pass', () => {
    it('should research deep candidates before claiming new items, keeping a failed one at its light result', async () => {
      work.findDeepCandidates.mockResolvedValue([snapshot(1), snapshot(2)]);
      ai.generateStructured
        .mockResolvedValueOnce(ok(DEEP_1))
        .mockRejectedValue(new AiCallError('provider', 'bad request'));

      await adapter().process(request);

      expect(work.claim).not.toHaveBeenCalled();
      expect(ai.generateStructured.mock.calls[0][0]).toMatchObject({
        model: DEEP_1,
        tools: ['webSearch', 'readUrls'],
        feature: 'radar.analyze',
      });
      expect(work.saveEnrichment).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'deep');
      expect(work.noteError).toHaveBeenCalledWith(snapshot(2).id, 'Deep analysis failed: bad request');
      expect(work.markFailed).not.toHaveBeenCalled();
    });

    it('should only ask for the deep analyses the run has left, and none once the cap is used', async () => {
      work.countDeep.mockResolvedValueOnce(config.deep.maxPerRun - 1).mockResolvedValueOnce(config.deep.maxPerRun);
      ai.generateStructured.mockResolvedValue(ok(LITE_1));

      await adapter().process(request);
      await adapter().process(request);

      expect(work.findDeepCandidates).toHaveBeenCalledTimes(1);
      expect(work.findDeepCandidates).toHaveBeenCalledWith(RUN_ID, config.deep.minScore, 1);
    });
  });

  describe('spend guards', () => {
    it('should stop without claiming when the run budget is already spent', async () => {
      ai.spentMicroUsd.mockResolvedValue(1_000_000);

      await expect(adapter().process(request)).resolves.toMatchObject({ state: 'stopped' });
      expect(work.claim).not.toHaveBeenCalled();
    });

    it('should give the rest back and stop when the budget runs out mid-batch', async () => {
      work.claim.mockResolvedValue([claimed(1), claimed(2), claimed(3)]);
      ai.spentMicroUsd.mockResolvedValueOnce(0).mockResolvedValueOnce(1_000_000);
      ai.generateStructured.mockResolvedValue(ok(LITE_1));

      await expect(adapter().process(request)).resolves.toMatchObject({ state: 'stopped' });
      expect(ai.generateStructured).toHaveBeenCalledTimes(1);
      expect(work.release).toHaveBeenCalledWith(ids(2, 3), false);
    });

    it('should give the batch back and stop when the daily cap refuses the call', async () => {
      work.claim.mockResolvedValue([claimed(1), claimed(2)]);
      ai.generateStructured.mockRejectedValue(new AiCallError('over-budget', 'cap'));

      await expect(adapter().process(request)).resolves.toMatchObject({ state: 'stopped' });
      expect(ai.generateStructured).toHaveBeenCalledTimes(1);
      expect(work.release).toHaveBeenCalledWith(ids(1, 2), false);
    });
  });

  it('should report idle when no deep candidate and no item is left to claim', async () => {
    work.claim.mockResolvedValue([]);

    await expect(adapter().process(request)).resolves.toEqual({ state: 'idle' });
  });
});
