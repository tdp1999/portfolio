export type AiBilling = 'free' | 'paid';
export type AiCallStatus = 'SUCCEEDED' | 'FAILED' | 'RATE_LIMITED';
export type AiUsageRange = '24h' | '7d' | '30d';

/** The provider as the API describes it; the console never names a provider itself. */
export interface AiProvider {
  name: string;
  displayName: string;
  keyEnv: string;
  links: { pricing: string; usage: string | null; limits: string | null };
}

export interface AiStatus {
  provider: AiProvider;
  configured: boolean;
  keySuffix: string | null;
  billing: AiBilling;
  defaultModel: string;
  lastCall: { at: string; status: AiCallStatus; error: string | null } | null;
}

export type AiTestResult =
  | { ok: true; model: string; latencyMs: number }
  | { ok: false; model: string; errorKind: string; message: string };

export interface AiUsageTotals {
  calls: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  costMicroUsd: number;
  billedMicroUsd: number;
}

export interface AiUsage {
  range: AiUsageRange;
  from: string;
  totals: AiUsageTotals;
  byModel: (AiUsageTotals & { model: string })[];
  byFeature: (AiUsageTotals & { feature: string })[];
}

export interface AiCall {
  id: string;
  createdAt: string;
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
  ref: { type: string; id: string } | null;
  searchCount: number;
  urlCount: number;
}

/** A breakdown row with its figures already formatted for the template. */
export interface AiBreakdownRow {
  key: string;
  label: string;
  calls: number;
  failed: number;
  tokens: string;
  /** Rendered by `<console-money>` in the display currency. */
  costMicroUsd: number;
}

/** A recent call with its figures already formatted for the template. */
export interface AiCallRow extends AiCall {
  featureLabel: string;
  tokens: string;
  latency: string;
  tools: string | null;
  /** Router link to the record the call served, when the console has a page for it. */
  refLink: string[] | null;
}

export type AiLimitSource = 'header' | 'error' | 'model-info' | 'documented';
export type AiLimitWindow = 'minute' | 'day' | 'month';
export type AiLimitKind = 'requests' | 'input-tokens' | 'tokens' | 'web-search-queries' | 'other';

export interface AiLimit {
  metric: string;
  label: string;
  kind: AiLimitKind;
  window: AiLimitWindow | null;
  model: string | null;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  resetAt: string | null;
  source: AiLimitSource;
  observedAt: string | null;
  url: string | null;
  checkedOn: string | null;
}

export interface AiModelInfo {
  model: string;
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  thinking: boolean | null;
  error: string | null;
}

export interface AiLimits {
  configured: boolean;
  reportsRateLimits: boolean;
  dailyCap: { capMicroUsd: number; spentMicroUsd: number; resetsAt: string };
  usage: { callsLastMinute: number; callsToday: number; tokensToday: number; searchQueriesThisMonth: number };
  limits: AiLimit[];
  models: AiModelInfo[];
  modelsError: string | null;
  balance: { currency: string; amount: number } | null;
  balanceError: string | null;
}

/** A limit row with its figures already formatted for the template. */
export interface AiLimitRow {
  key: string;
  label: string;
  scope: string;
  limit: string;
  used: string;
  remaining: string;
  resetAt: string | null;
  sourceLabel: string;
  sourceHint: string;
  url: string | null;
}

/** A model row with its figures already formatted for the template. */
export interface AiModelRow {
  model: string;
  input: string;
  output: string;
  thinking: string;
  error: string | null;
}

/** The Limits section, built once per response. */
export interface AiLimitsView {
  capSpentMicroUsd: number;
  capMicroUsd: number;
  /** 0 to 100, for the bar. */
  capPercent: number;
  capResetsAt: string;
  callsLastMinute: string;
  callsToday: string;
  tokensToday: string;
  searchQueriesThisMonth: string;
  rows: AiLimitRow[];
  models: AiModelRow[];
  balance: string | null;
}
