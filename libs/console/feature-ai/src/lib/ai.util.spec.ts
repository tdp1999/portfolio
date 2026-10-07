import type { AiLimits } from './ai.types';
import { formatLatency, formatTokens, toLimitsView, toolSummary } from './ai.util';

describe('formatTokens / formatLatency / toolSummary', () => {
  it('shortens large counts and seconds', () => {
    expect(formatTokens(950)).toBe('950');
    expect(formatTokens(12_400)).toBe('12.4K');
    expect(formatLatency(901)).toBe('901 ms');
    expect(formatLatency(29_823)).toBe('29.8 s');
  });

  it('names only the tools a call used', () => {
    expect(toolSummary(0, 0)).toBeNull();
    expect(toolSummary(1, 3)).toBe('1 search, 3 pages read');
  });
});

describe('toLimitsView', () => {
  const data: AiLimits = {
    configured: true,
    reportsRateLimits: false,
    dailyCap: { capMicroUsd: 1_000_000, spentMicroUsd: 1_500_000, resetsAt: '2026-10-08T00:00:00.000Z' },
    usage: { callsLastMinute: 0, callsToday: 8, tokensToday: 44_778, searchQueriesThisMonth: 4 },
    limits: [
      {
        metric: 'rpm',
        label: 'Requests per minute',
        kind: 'requests',
        window: 'minute',
        model: 'model-a',
        limit: 10,
        used: null,
        remaining: 0,
        resetAt: null,
        source: 'error',
        observedAt: '2026-10-07T10:00:23.000Z',
        url: null,
        checkedOn: null,
      },
    ],
    models: [{ model: 'model-a', inputTokenLimit: 1_048_576, outputTokenLimit: 8192, thinking: null, error: null }],
    modelsError: null,
    balance: { currency: 'CNY', amount: 12.5 },
    balanceError: null,
  };

  it('caps the bar at 100% and formats each figure for reading', () => {
    const view = toLimitsView(data);

    expect(view.capPercent).toBe(100);
    expect(view.rows[0]).toMatchObject({
      scope: 'model-a, per minute',
      used: 'Not counted',
      remaining: '0',
      sourceHint: 'Last reported 2026-10-07 10:00 UTC',
    });
    expect(view.models[0]).toMatchObject({ input: '1M', output: '8,192', thinking: 'Unknown' });
    expect(view.balance).toBe('CN¥12.50');
  });
});
