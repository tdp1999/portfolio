/** What an AI call was for. Every caller names one, so the ledger can be read per feature. */
export type AiFeature = 'radar.analyze' | 'radar.analyze.light' | 'radar.transcript' | 'radar.brief' | 'ai.test';

export type AiCallStatus = 'SUCCEEDED' | 'FAILED' | 'RATE_LIMITED';

/** Why a call failed, so callers can act on it without reading provider messages. */
export type AiErrorKind =
  | 'not-configured'
  | 'refused'
  | 'rate-limited'
  | 'unavailable'
  | 'invalid-output'
  | 'auth'
  | 'provider'
  | 'network'
  /** The daily spend cap is reached; nothing was sent. */
  | 'over-budget';

/** Tokens one call used, as the provider reported them. */
export interface AiTokenUsage {
  /** Prompt tokens, cached ones included. */
  inputTokens: number;
  /** Answer tokens, thinking excluded. */
  outputTokens: number;
  /** Thinking tokens: billed at the output price. */
  thinkingTokens: number;
  /** The part of `inputTokens` served from the cache. */
  cachedTokens: number;
  /** Tokens the built-in tools added to the prompt (search results, fetched pages). */
  toolTokens: number;
}

/** USD per million tokens, plus the per-query fee for web search where the provider charges one. */
export interface AiModelPrice {
  input: number;
  output: number;
  cachedInput: number;
  /** USD per 1,000 web search queries the model runs; absent when search has no separate fee. */
  webSearchPer1k?: number;
}

/** One URL a built-in tool read, with the provider's retrieval status. */
export interface AiTraceUrl {
  url: string;
  status: string;
}

/**
 * What the model searched and read during one call, stored as-is on the usage row (AI-002, AI-003).
 * Provider-neutral: each adapter maps its own response metadata into this shape.
 */
export interface AiTrace {
  searchQueries: string[];
  sources: { url: string; title: string | null }[];
  urls: AiTraceUrl[];
  /** The provider's own end state ("completed", "incomplete", "STOP"), for reading only. */
  finishReason: string | null;
}

/** The item or run a call served, so the ledger links back to it. Also used for the larger unit a call belongs to. */
export interface AiRef {
  type: string;
  id: string;
}

export interface AiUsageRecordInput {
  provider: string;
  model: string;
  feature: AiFeature;
  status: AiCallStatus;
  errorKind: AiErrorKind | null;
  error: string | null;
  usage: AiTokenUsage;
  costMicroUsd: number | null;
  billed: boolean;
  latencyMs: number;
  ref: AiRef | null;
  /** The unit whose budget the call counts against (a Radar run). */
  group: AiRef | null;
  /** Web search queries the provider ran, billed per query. */
  searchQueries: number;
  trace: AiTrace | null;
}

/** A usage window the console reads totals for. */
export type AiUsageRange = '24h' | '7d' | '30d';

/** Calls, tokens and cost summed over a set of usage rows. */
export interface AiUsageTotals {
  calls: number;
  failed: number;
  /** Prompt plus tool tokens. */
  tokensIn: number;
  /** Answer plus thinking tokens. */
  tokensOut: number;
  /** Rows whose model has no price are left out of the sum. */
  costMicroUsd: number;
  /** Part of the cost that was charged (paid tier). */
  billedMicroUsd: number;
}

export interface AiUsageSummary {
  totals: AiUsageTotals;
  byModel: (AiUsageTotals & { model: string })[];
  byFeature: (AiUsageTotals & { feature: string })[];
}

/** One ledger row as the console lists it. */
export interface AiCallRecord {
  id: string;
  createdAt: Date;
  provider: string;
  model: string;
  feature: string;
  status: AiCallStatus;
  errorKind: string | null;
  error: string | null;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number | null;
  billed: boolean;
  latencyMs: number;
  ref: AiRef | null;
  searchCount: number;
  urlCount: number;
}
