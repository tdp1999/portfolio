export type AiBilling = 'free' | 'paid';
export type AiCallStatus = 'SUCCEEDED' | 'FAILED' | 'RATE_LIMITED';
export type AiUsageRange = '24h' | '7d' | '30d';

export interface AiStatus {
  provider: 'gemini';
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
  cost: string;
}

/** A recent call with its figures already formatted for the template. */
export interface AiCallRow extends AiCall {
  featureLabel: string;
  tokens: string;
  cost: string;
  latency: string;
  tools: string | null;
  /** Router link to the record the call served, when the console has a page for it. */
  refLink: string[] | null;
}
