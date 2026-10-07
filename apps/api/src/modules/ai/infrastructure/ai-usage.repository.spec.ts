import type { PrismaService } from '../../../shared/prisma';
import { AiUsageRepository } from './ai-usage.repository';

const row = (
  model: string | null,
  feature: string | null,
  byModel: number,
  byFeature: number,
  cost: number,
  calls = 1
) => ({
  model,
  feature,
  by_model: byModel,
  by_feature: byFeature,
  calls,
  failed: 0,
  tokens_in: 10,
  tokens_out: 5,
  cost,
  billed: 0,
});

describe('AiUsageRepository.summarize', () => {
  it('should split grouping-set rows into totals, by model and by feature, costliest first', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValue([
          row('gemini-a', null, 0, 1, 10),
          row(null, 'radar.analyze', 1, 0, 30),
          row(null, null, 1, 1, 70, 3),
          row('gemini-b', null, 0, 1, 60),
          row(null, 'ai.test', 1, 0, 40),
        ]),
    } as unknown as PrismaService;

    const summary = await new AiUsageRepository(prisma).summarize(new Date());

    expect(summary.totals).toMatchObject({ calls: 3, costMicroUsd: 70 });
    expect(summary.byModel.map((m) => m.model)).toEqual(['gemini-b', 'gemini-a']);
    expect(summary.byFeature.map((f) => f.feature)).toEqual(['ai.test', 'radar.analyze']);
  });

  it('should return zero totals when the window has no calls', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]) } as unknown as PrismaService;

    const summary = await new AiUsageRepository(prisma).summarize(new Date());

    expect(summary).toEqual({
      totals: { calls: 0, failed: 0, tokensIn: 0, tokensOut: 0, costMicroUsd: 0, billedMicroUsd: 0 },
      byModel: [],
      byFeature: [],
    });
  });
});
