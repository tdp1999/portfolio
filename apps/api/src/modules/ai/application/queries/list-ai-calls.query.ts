import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AI_USAGE_REPOSITORY } from '../ai.token';
import { AiCallDto } from '../ai.dto';
import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';

/** The latest calls, newest first. `limit` is clamped to 1..100 (default 50). */
export class ListAiCallsQuery {
  constructor(readonly limit: unknown) {}
}

@QueryHandler(ListAiCallsQuery)
export class ListAiCallsHandler implements IQueryHandler<ListAiCallsQuery> {
  private static readonly DEFAULT_LIMIT = 50;
  private static readonly MAX_LIMIT = 100;

  constructor(@Inject(AI_USAGE_REPOSITORY) private readonly usageRepo: IAiUsageRepository) {}

  async execute(query: ListAiCallsQuery): Promise<AiCallDto[]> {
    const n = Number(query.limit);
    const limit =
      Number.isInteger(n) && n > 0 ? Math.min(n, ListAiCallsHandler.MAX_LIMIT) : ListAiCallsHandler.DEFAULT_LIMIT;
    const rows = await this.usageRepo.listRecent(limit);
    return rows.map(({ createdAt, ...row }) => ({ ...row, createdAt: createdAt.toISOString() }));
  }
}
