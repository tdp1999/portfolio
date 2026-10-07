import { z } from 'zod';

import { AiCallError } from './ai-call.error';
import { AiClientService } from './ai-client.service';
import { AiLimitStore } from './ai-limit.store';
import type { AiConfig } from './ai.config';
import type { IAiProvider } from './ports/ai-provider.port';
import type { IAiUsageRepository } from './ports/ai-usage.repository.port';

const KEY = 'AIza-test-key-1234';
const usage = { inputTokens: 1000, outputTokens: 100, thinkingTokens: 0, cachedTokens: 0, toolTokens: 0 };
const trace = { searchQueries: ['q'], sources: [], urls: [], finishReason: 'STOP' };
const schema = z.object({ ok: z.boolean() });
const request = { system: 's', parts: [{ text: 'hi' }], schema, feature: 'ai.test' as const };

describe('AiClientService', () => {
  let provider: jest.Mocked<IAiProvider>;
  let usageRepo: jest.Mocked<IAiUsageRepository>;
  let store: AiLimitStore;

  const client = (config: Partial<AiConfig> = {}) =>
    new AiClientService(
      { apiKey: KEY, billing: 'free', defaultModel: 'gemini-2.5-flash', dailyCapMicroUsd: 1_000_000, ...config },
      provider,
      usageRepo,
      store
    );
  const recorded = () => usageRepo.add.mock.calls[0][0];

  beforeEach(() => {
    provider = {
      profile: { name: 'gemini', keyEnv: 'GEMINI_API_KEY' } as IAiProvider['profile'],
      generate: jest.fn(),
      getModelInfo: jest.fn(),
      getBalance: jest.fn(),
    };
    store = new AiLimitStore();
    usageRepo = {
      add: jest.fn(),
      findLatest: jest.fn(),
      summarize: jest.fn(),
      listRecent: jest.fn(),
      sumCost: jest.fn(),
      sumCostSince: jest.fn().mockResolvedValue(0),
      sumCostByGroup: jest.fn(),
      countLedger: jest.fn(),
      listModelsSince: jest.fn(),
    };
  });

  it('should refuse tools without limits before calling the provider (AI-002)', async () => {
    await expect(client().generateStructured({ ...request, tools: ['webSearch'] })).rejects.toMatchObject({
      kind: 'refused',
    });
    expect(provider.generate).not.toHaveBeenCalled();
    expect(usageRepo.add).not.toHaveBeenCalled();
  });

  it('should refuse every call once the recorded spend of the day reaches the cap, without calling the provider', async () => {
    usageRepo.sumCostSince.mockResolvedValue(1_000_000);

    await expect(client().generateStructured(request)).rejects.toMatchObject({ kind: 'over-budget' });
    expect(usageRepo.sumCostSince.mock.calls[0][0].toISOString()).toMatch(/T00:00:00\.000Z$/);
    expect(provider.generate).not.toHaveBeenCalled();
    expect(usageRepo.add).not.toHaveBeenCalled();
  });

  it('should record a succeeded call with its cost and return the validated data', async () => {
    provider.generate.mockResolvedValue({
      text: '{"ok":true}',
      complete: true,
      usage,
      searchQueries: 0,
      trace,
      limits: [],
    });

    const result = await client().generateStructured(request);

    expect(result.data).toEqual({ ok: true });
    // 1000 * 0.3 + 100 * 2.5
    expect(recorded()).toMatchObject({ status: 'SUCCEEDED', costMicroUsd: 550, model: 'gemini-2.5-flash', trace });
  });

  it('should record an answer that fails the schema as failed, with the tokens it used', async () => {
    provider.generate.mockResolvedValue({
      text: '{"ok":"yes"}',
      complete: true,
      usage,
      searchQueries: 0,
      trace,
      limits: [],
    });

    await expect(client().generateStructured(request)).rejects.toMatchObject({ kind: 'invalid-output' });
    expect(recorded()).toMatchObject({ status: 'FAILED', errorKind: 'invalid-output', usage });
  });

  it('should record a rate limit and keep the retry delay on the error', async () => {
    provider.generate.mockRejectedValue(new AiCallError('rate-limited', 'quota', 30000));

    await expect(client().generateStructured(request)).rejects.toMatchObject({
      kind: 'rate-limited',
      retryAfterMs: 30000,
    });
    expect(recorded()).toMatchObject({ status: 'RATE_LIMITED', errorKind: 'rate-limited' });
  });

  it('should keep the limit a rate-limit error names, so the AI page shows it after the run', async () => {
    const limit = {
      metric: 'requests-per-minute',
      label: 'Requests per minute',
      kind: 'requests' as const,
      window: 'minute' as const,
      model: 'gemini-2.5-flash',
      limit: 10,
      remaining: 0,
      resetAt: null,
      source: 'error' as const,
      observedAt: new Date(),
    };
    provider.generate.mockRejectedValue(new AiCallError('rate-limited', 'quota', null, [limit]));

    await expect(client().generateStructured(request)).rejects.toMatchObject({ kind: 'rate-limited' });

    expect(store.listObserved()).toEqual([limit]);
  });

  it.each([
    ['free', false],
    ['paid', true],
  ] as const)('should mark a %s-tier call billed=%s while still estimating its cost', async (billing, billed) => {
    provider.generate.mockResolvedValue({
      text: '{"ok":true}',
      complete: true,
      usage,
      searchQueries: 0,
      trace,
      limits: [],
    });

    await client({ billing }).generateStructured(request);

    expect(recorded()).toMatchObject({ billed, costMicroUsd: 550 });
  });

  it('should never store or throw the key, even when the provider echoes it (AI-004)', async () => {
    provider.generate.mockRejectedValue(new AiCallError('auth', `bad key ${KEY}`));

    await expect(client().generateStructured(request)).rejects.toMatchObject({
      kind: 'auth',
      message: 'bad key [redacted]',
    });
    expect(recorded().error).toBe('bad key [redacted]');
  });

  it('should still return a paid answer when the ledger write fails', async () => {
    provider.generate.mockResolvedValue({
      text: '{"ok":true}',
      complete: true,
      usage,
      searchQueries: 0,
      trace,
      limits: [],
    });
    usageRepo.add.mockRejectedValue(new Error('db down'));

    await expect(client().generateStructured(request)).resolves.toMatchObject({ data: { ok: true } });
  });

  it('should refuse a ref id that is not a uuid before calling the provider', async () => {
    await expect(
      client().generateStructured({ ...request, ref: { type: 'radar-item', id: 'item-1' } })
    ).rejects.toMatchObject({ kind: 'refused' });
    expect(provider.generate).not.toHaveBeenCalled();
  });
});
