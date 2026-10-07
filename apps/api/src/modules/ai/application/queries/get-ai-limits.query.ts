import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import type { AiLedgerCounts, AiModelInfo } from '../../domain/ai-limit.types';
import { AiLimitPolicy } from '../../domain/policies/ai-limit.policy';
import { AiLimitStore } from '../ai-limit.store';
import { AI_CONFIG, AI_PROVIDER, AI_USAGE_REPOSITORY } from '../ai.token';
import type { AiConfig } from '../ai.config';
import type { AiLimitDto, AiLimitsDto, AiModelInfoDto } from '../ai.dto';
import type { IAiProvider } from '../ports/ai-provider.port';
import type { IAiUsageRepository } from '../ports/ai-usage.repository.port';

/** Every limit the app knows about the provider, next to how much of each the ledger shows used. */
export class GetAiLimitsQuery {}

@QueryHandler(GetAiLimitsQuery)
export class GetAiLimitsHandler implements IQueryHandler<GetAiLimitsQuery> {
  // --- Constants ---

  /** Models shown: the default one plus the ones called in this window, at most `MAX_MODELS`. */
  private static readonly MODEL_WINDOW_MS = 30 * 86_400_000;
  private static readonly MAX_MODELS = 6;
  private static readonly MAX_ERROR_LENGTH = 300;

  constructor(
    @Inject(AI_CONFIG) private readonly config: AiConfig,
    @Inject(AI_PROVIDER) private readonly provider: IAiProvider,
    @Inject(AI_USAGE_REPOSITORY) private readonly usageRepo: IAiUsageRepository,
    private readonly store: AiLimitStore
  ) {}

  async execute(): Promise<AiLimitsDto> {
    const now = new Date();
    const dayFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const configured = this.config.apiKey !== null;
    const [counts, models, balance] = await Promise.all([
      this.usageRepo.countLedger({
        minuteFrom: new Date(now.getTime() - 60_000),
        dayFrom,
        monthFrom: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
      }),
      configured ? this.models(now) : Promise.resolve(null),
      configured ? this.balance() : Promise.resolve(null),
    ]);

    return {
      configured,
      reportsRateLimits: this.provider.profile.reportsRateLimits,
      dailyCap: {
        capMicroUsd: this.config.dailyCapMicroUsd,
        spentMicroUsd: counts.spentTodayMicroUsd,
        resetsAt: new Date(dayFrom.getTime() + 86_400_000).toISOString(),
      },
      usage: {
        callsLastMinute: counts.callsLastMinute,
        callsToday: counts.callsToday,
        tokensToday: counts.tokensToday,
        searchQueriesThisMonth: counts.searchQueriesThisMonth,
      },
      limits: this.limits(counts, now),
      models: models?.items ?? [],
      modelsError: configured ? (models?.error ?? null) : 'not-configured',
      balance: balance?.value ?? null,
      balanceError: balance?.error ?? null,
    };
  }

  // --- Private ---

  private limits(counts: AiLedgerCounts, now: Date): AiLimitDto[] {
    const documented = this.provider.profile.documentedLimits.map((d): AiLimitDto => {
      const used = AiLimitPolicy.used(d.kind, d.window, counts);
      return {
        metric: d.metric,
        label: d.label,
        kind: d.kind,
        window: d.window,
        model: null,
        limit: d.limit,
        used,
        remaining: AiLimitPolicy.remaining(d.limit, used, null),
        resetAt: null,
        source: 'documented',
        observedAt: null,
        url: d.url,
        checkedOn: d.checkedOn,
      };
    });
    const observed = this.store.listObserved().map((o): AiLimitDto => {
      const used = AiLimitPolicy.used(o.kind, o.window, counts);
      // Past its reset, the reported figure is stale: fall back to the limit minus the ledger usage.
      const reported = o.resetAt && o.resetAt <= now ? null : o.remaining;
      return {
        metric: o.metric,
        label: o.label,
        kind: o.kind,
        window: o.window,
        model: o.model,
        limit: o.limit,
        used,
        remaining: AiLimitPolicy.remaining(o.limit, used, reported),
        resetAt: o.resetAt?.toISOString() ?? null,
        source: o.source,
        observedAt: o.observedAt.toISOString(),
        url: null,
        checkedOn: null,
      };
    });
    return [...observed, ...documented];
  }

  /** Metadata per model, from the cache when fresh; one failed model does not hide the others. */
  private async models(now: Date): Promise<{ items: AiModelInfoDto[]; error: string | null }> {
    const called = await this.usageRepo.listModelsSince(
      new Date(now.getTime() - GetAiLimitsHandler.MODEL_WINDOW_MS),
      GetAiLimitsHandler.MAX_MODELS
    );
    const names = [...new Set([this.config.defaultModel, ...called])].slice(0, GetAiLimitsHandler.MAX_MODELS);
    const results = await Promise.all(names.map((model) => this.modelInfo(model)));
    const items = results.map(
      (info, i): AiModelInfoDto =>
        info instanceof Error
          ? { model: names[i], inputTokenLimit: null, outputTokenLimit: null, thinking: null, error: this.clean(info) }
          : { ...info, error: null }
    );
    const failed = items.filter((m) => m.error);
    return { items, error: failed.length === items.length && failed.length ? failed[0].error : null };
  }

  private async modelInfo(model: string): Promise<AiModelInfo | Error> {
    const cached = this.store.cachedModelInfo(model);
    if (cached) return cached;
    const value = await this.provider
      .getModelInfo(model)
      .catch((err: unknown) => (err instanceof Error ? err : new Error(String(err))));
    this.store.cacheModelInfo(model, value);
    return value;
  }

  private async balance(): Promise<{ value: AiLimitsDto['balance']; error: string | null }> {
    try {
      return { value: await this.provider.getBalance(), error: null };
    } catch (err) {
      return { value: null, error: this.clean(err instanceof Error ? err : new Error(String(err))) };
    }
  }

  /** Short, and never the key, even if a provider echoes it back (AI-004). */
  private clean(err: Error): string {
    const key = this.config.apiKey;
    const message = key ? err.message.split(key).join('[redacted]') : err.message;
    return message.slice(0, GetAiLimitsHandler.MAX_ERROR_LENGTH);
  }
}
