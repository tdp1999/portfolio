import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AI_CONFIG, AI_PROVIDER, AI_USAGE_REPOSITORY } from '../ai.token';
import { AiConfig, maskKey } from '../ai.config';
import { AiStatusDto } from '../ai.dto';
import type { IAiProvider } from '../ports/ai-provider.port';
import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';

/** Whether the AI provider is set up, and how its last call went. */
export class GetAiStatusQuery {}

@QueryHandler(GetAiStatusQuery)
export class GetAiStatusHandler implements IQueryHandler<GetAiStatusQuery> {
  constructor(
    @Inject(AI_CONFIG) private readonly config: AiConfig,
    @Inject(AI_PROVIDER) private readonly provider: IAiProvider,
    @Inject(AI_USAGE_REPOSITORY) private readonly usageRepo: IAiUsageRepository
  ) {}

  async execute(): Promise<AiStatusDto> {
    const last = await this.usageRepo.findLatest();
    const { name, displayName, keyEnv, links } = this.provider.profile;
    return {
      provider: { name, displayName, keyEnv, links },
      configured: this.config.apiKey !== null,
      keySuffix: maskKey(this.config.apiKey),
      billing: this.config.billing,
      defaultModel: this.config.defaultModel,
      lastCall: last ? { at: last.createdAt.toISOString(), status: last.status, error: last.error } : null,
    };
  }
}
