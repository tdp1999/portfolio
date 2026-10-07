/**
 * Provider-neutral limit shapes. Each adapter fills them with what its provider exposes
 * (response headers, rate-limit errors, model metadata, documentation); nothing outside the
 * adapter reads a provider's own field names.
 */

/** Where a limit figure came from, so the page can say how far to trust it. */
export type AiLimitSource = 'header' | 'error' | 'model-info' | 'documented';

export type AiLimitWindow = 'minute' | 'day' | 'month';

/** What a limit counts, so the ledger can say how much of it the app used. */
export type AiLimitKind = 'requests' | 'input-tokens' | 'tokens' | 'web-search-queries' | 'other';

/** One model's fixed limits, as the provider's model metadata reports them. */
export interface AiModelInfo {
  model: string;
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  /** Whether the model can think before answering; null when the provider does not say. */
  thinking: boolean | null;
}

/** A limit the provider reported during a call (headers or a rate-limit error). */
export interface AiObservedLimit {
  /** The provider's own id for the quota; the last observation is kept per metric and model. */
  metric: string;
  label: string;
  kind: AiLimitKind;
  window: AiLimitWindow | null;
  /** The model the limit applies to, when it is per model. */
  model: string | null;
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
  source: Extract<AiLimitSource, 'header' | 'error'>;
  observedAt: Date;
}

/** An allowance from the provider's documentation, kept as a code constant with the date it was checked. */
export interface AiDocumentedLimit {
  metric: string;
  label: string;
  kind: AiLimitKind;
  window: AiLimitWindow;
  limit: number;
  url: string;
  checkedOn: string;
}

/** Prepaid credit left on the account, for providers that expose it. */
export interface AiBalance {
  /** ISO 4217 code of the account's currency (USD, CNY). */
  currency: string;
  amount: number;
}

/** Links and capabilities a provider declares about itself, for the console. */
export interface AiProviderProfile {
  /** Stable id stored on usage rows ("gemini"). */
  name: string;
  displayName: string;
  /** The env variable that holds the key, named in setup hints. */
  keyEnv: string;
  /** True when every response carries rate-limit headers (OpenAI-compatible APIs do). */
  reportsRateLimits: boolean;
  links: {
    pricing: string;
    /** The provider's own usage or billing page, when there is one. */
    usage: string | null;
    /** The provider's rate-limit page, for limits it does not expose to an API key. */
    limits: string | null;
  };
  documentedLimits: readonly AiDocumentedLimit[];
}

/** Ledger counts the limits are compared with. Times are UTC. */
export interface AiLedgerCounts {
  callsLastMinute: number;
  callsToday: number;
  inputTokensLastMinute: number;
  inputTokensToday: number;
  tokensToday: number;
  searchQueriesThisMonth: number;
  spentTodayMicroUsd: number;
}
