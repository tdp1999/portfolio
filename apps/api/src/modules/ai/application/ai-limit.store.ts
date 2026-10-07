import { Injectable } from '@nestjs/common';

import type { AiModelInfo, AiObservedLimit } from '../domain/ai-limit.types';

/**
 * What the app has learned about the provider's limits, kept in memory: the last observed value per
 * metric and model (a 429 seen during a run still shows afterwards) and cached model metadata.
 * One API instance, so memory is enough; a restart starts empty and the next call or 429 refills it.
 */
@Injectable()
export class AiLimitStore {
  // --- Constants ---

  /** Model metadata changes rarely: one lookup per model every few hours, never one per page view. */
  static readonly MODEL_INFO_TTL_MS = 6 * 60 * 60 * 1000;
  /** A failed lookup is retried sooner, but still not on every page view. */
  static readonly MODEL_INFO_ERROR_TTL_MS = 10 * 60 * 1000;

  private readonly observed = new Map<string, AiObservedLimit>();
  private readonly modelInfo = new Map<string, { value: AiModelInfo | Error; expiresAt: number }>();

  observe(limits: readonly AiObservedLimit[]): void {
    for (const limit of limits) this.observed.set(`${limit.metric}|${limit.model ?? ''}`, limit);
  }

  /** Newest first. */
  listObserved(): AiObservedLimit[] {
    return [...this.observed.values()].sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
  }

  /** The cached metadata (or the cached failure), or undefined when none is fresh. */
  cachedModelInfo(model: string, now = Date.now()): AiModelInfo | Error | undefined {
    const entry = this.modelInfo.get(model);
    return entry && entry.expiresAt > now ? entry.value : undefined;
  }

  cacheModelInfo(model: string, value: AiModelInfo | Error, now = Date.now()): void {
    const ttl = value instanceof Error ? AiLimitStore.MODEL_INFO_ERROR_TTL_MS : AiLimitStore.MODEL_INFO_TTL_MS;
    this.modelInfo.set(model, { value, expiresAt: now + ttl });
  }
}
