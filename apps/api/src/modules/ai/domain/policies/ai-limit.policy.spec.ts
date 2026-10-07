import type { AiLedgerCounts } from '../ai-limit.types';
import { AiLimitPolicy } from './ai-limit.policy';

const counts: AiLedgerCounts = {
  callsLastMinute: 1,
  callsToday: 2,
  inputTokensLastMinute: 3,
  inputTokensToday: 4,
  tokensToday: 5,
  searchQueriesThisMonth: 6,
  spentTodayMicroUsd: 7,
};

describe('AiLimitPolicy', () => {
  it.each([
    ['requests', 'minute', 1],
    ['requests', 'day', 2],
    ['input-tokens', 'minute', 3],
    ['input-tokens', 'day', 4],
    ['tokens', 'day', 5],
    ['web-search-queries', 'month', 6],
    ['requests', null, null],
    ['other', 'day', null],
  ] as const)('should count %s per %s from the ledger as %s', (kind, window, used) => {
    expect(AiLimitPolicy.used(kind, window, counts)).toBe(used);
  });

  it.each([
    [5000, 120, 3, 3],
    [5000, 120, null, 4880],
    [100, 150, null, 0],
    [null, 10, null, null],
    [100, null, null, null],
  ])('should give limit %s, used %s, reported %s as %s remaining', (limit, used, reported, remaining) => {
    expect(AiLimitPolicy.remaining(limit, used, reported)).toBe(remaining);
  });
});
