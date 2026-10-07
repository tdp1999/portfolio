import { AiCallError } from '../ai-call.error';
import { AiLimitStore } from '../ai-limit.store';
import type { AiConfig } from '../ai.config';
import type { IAiProvider } from '../ports/ai-provider.port';
import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';
import { GetAiLimitsHandler } from './get-ai-limits.query';

const config: AiConfig = { apiKey: 'k', billing: 'free', defaultModel: 'model-a', dailyCapMicroUsd: 1_000_000 };
const counts = {
  callsLastMinute: 0,
  callsToday: 4,
  inputTokensLastMinute: 0,
  inputTokensToday: 0,
  tokensToday: 900,
  searchQueriesThisMonth: 120,
  spentTodayMicroUsd: 250_000,
};

describe('GetAiLimitsHandler', () => {
  let provider: jest.Mocked<IAiProvider>;
  let usageRepo: jest.Mocked<IAiUsageRepository>;
  let store: AiLimitStore;
  const handler = (c: AiConfig = config) => new GetAiLimitsHandler(c, provider, usageRepo, store);

  beforeEach(() => {
    provider = {
      profile: {
        name: 'p',
        displayName: 'P',
        keyEnv: 'P_KEY',
        reportsRateLimits: false,
        links: { pricing: 'https://p.dev/pricing', usage: null, limits: null },
        documentedLimits: [
          {
            metric: 'search-free',
            label: 'Free searches',
            kind: 'web-search-queries',
            window: 'month',
            limit: 5000,
            url: 'https://p.dev/pricing',
            checkedOn: '2026-10-07',
          },
        ],
      },
      generate: jest.fn(),
      getModelInfo: jest.fn(async (model: string) => ({
        model,
        inputTokenLimit: 1000,
        outputTokenLimit: 100,
        thinking: true,
      })),
      getBalance: jest.fn().mockResolvedValue(null),
    };
    usageRepo = {
      countLedger: jest.fn().mockResolvedValue(counts),
      listModelsSince: jest.fn().mockResolvedValue(['model-b', 'model-a']),
    } as unknown as jest.Mocked<IAiUsageRepository>;
    store = new AiLimitStore();
  });

  it('should set the daily cap and each documented allowance against the ledger', async () => {
    const result = await handler().execute();

    expect(result.dailyCap).toMatchObject({ capMicroUsd: 1_000_000, spentMicroUsd: 250_000 });
    expect(result.limits).toEqual([
      expect.objectContaining({ metric: 'search-free', used: 120, remaining: 4880, source: 'documented' }),
    ]);
  });

  it('should list the default model first, keep a failed model with its reason, and not ask again while cached', async () => {
    provider.getModelInfo.mockImplementation(async (model) => {
      if (model === 'model-b') throw new AiCallError('provider', 'Model not found');
      return { model, inputTokenLimit: 1000, outputTokenLimit: 100, thinking: true };
    });

    const first = await handler().execute();
    await handler().execute();

    expect(first.models.map((m) => [m.model, m.error])).toEqual([
      ['model-a', null],
      ['model-b', 'Model not found'],
    ]);
    expect(first.modelsError).toBeNull();
    expect(provider.getModelInfo).toHaveBeenCalledTimes(2);
  });

  it('should say why there are no models and not call the provider when no key is set', async () => {
    const result = await handler({ ...config, apiKey: null }).execute();

    expect(result).toMatchObject({ configured: false, models: [], modelsError: 'not-configured', balance: null });
    expect(provider.getModelInfo).not.toHaveBeenCalled();
    expect(provider.getBalance).not.toHaveBeenCalled();
  });

  it('should show the last limit a provider reported, with the remaining figure it gave', async () => {
    store.observe([
      {
        metric: 'rpd',
        label: 'Requests per day',
        kind: 'requests',
        window: 'day',
        model: 'model-a',
        limit: 20,
        remaining: 0,
        resetAt: null,
        source: 'error',
        observedAt: new Date(),
      },
    ]);

    const result = await handler().execute();

    expect(result.limits[0]).toMatchObject({ metric: 'rpd', used: 4, remaining: 0, source: 'error' });
  });

  it('should fall back to the ledger once a reported limit is past its reset', async () => {
    store.observe([
      {
        metric: 'rpd',
        label: 'Requests per day',
        kind: 'requests',
        window: 'day',
        model: 'model-a',
        limit: 20,
        remaining: 0,
        resetAt: new Date(Date.now() - 1_000),
        source: 'error',
        observedAt: new Date(Date.now() - 60_000),
      },
    ]);

    const result = await handler().execute();

    expect(result.limits[0]).toMatchObject({ metric: 'rpd', used: 4, remaining: 16 });
  });
});
