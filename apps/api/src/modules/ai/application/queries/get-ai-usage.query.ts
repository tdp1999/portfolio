import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AiUsageRange } from '../../domain/ai-usage.types';
import { AI_USAGE_REPOSITORY } from '../ai.token';
import { AiUsageDto } from '../ai.dto';
import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';

/** Usage totals over a window; an unknown range reads as 7 days. */
export class GetAiUsageQuery {
  constructor(readonly range: unknown) {}
}

@QueryHandler(GetAiUsageQuery)
export class GetAiUsageHandler implements IQueryHandler<GetAiUsageQuery> {
  private static readonly RANGE_MS: Record<AiUsageRange, number> = {
    '24h': 24 * 3_600_000,
    '7d': 7 * 24 * 3_600_000,
    '30d': 30 * 24 * 3_600_000,
  };

  constructor(@Inject(AI_USAGE_REPOSITORY) private readonly usageRepo: IAiUsageRepository) {}

  async execute(query: GetAiUsageQuery): Promise<AiUsageDto> {
    const range: AiUsageRange =
      typeof query.range === 'string' && Object.hasOwn(GetAiUsageHandler.RANGE_MS, query.range)
        ? (query.range as AiUsageRange)
        : '7d';
    const from = new Date(Date.now() - GetAiUsageHandler.RANGE_MS[range]);
    return { range, from: from.toISOString(), ...(await this.usageRepo.summarize(from)) };
  }
}
