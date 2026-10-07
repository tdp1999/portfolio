import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';
import { GetAiUsageHandler, GetAiUsageQuery } from './get-ai-usage.query';
import { ListAiCallsHandler, ListAiCallsQuery } from './list-ai-calls.query';

describe('AI queries', () => {
  let usageRepo: jest.Mocked<IAiUsageRepository>;

  beforeEach(() => {
    usageRepo = {
      add: jest.fn(),
      findLatest: jest.fn(),
      summarize: jest.fn().mockResolvedValue({ totals: {}, byModel: [], byFeature: [] }),
      listRecent: jest.fn().mockResolvedValue([]),
      sumCost: jest.fn(),
      sumCostSince: jest.fn(),
      sumCostByGroup: jest.fn(),
      countLedger: jest.fn(),
      listModelsSince: jest.fn(),
    };
  });

  it.each([
    ['30d', '30d', 30],
    ['bogus', '7d', 7],
    [undefined, '7d', 7],
  ])('should read range %s as %s', async (input, range, days) => {
    const before = Date.now();

    const result = await new GetAiUsageHandler(usageRepo).execute(new GetAiUsageQuery(input));

    expect(result.range).toBe(range);
    const from = usageRepo.summarize.mock.calls[0][0].getTime();
    expect(before - from).toBeGreaterThanOrEqual(days * 86_400_000);
    expect(before - from).toBeLessThan(days * 86_400_000 + 1000);
  });

  it.each([
    [undefined, 50],
    ['abc', 50],
    ['0', 50],
    ['20', 20],
    ['500', 100],
  ])('should clamp limit %s to %s', async (input, limit) => {
    await new ListAiCallsHandler(usageRepo).execute(new ListAiCallsQuery(input));

    expect(usageRepo.listRecent).toHaveBeenCalledWith(limit);
  });
});
