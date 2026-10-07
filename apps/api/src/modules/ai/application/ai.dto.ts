import type { AiBilling } from './ai.config';
import type {
  AiLimitKind,
  AiLimitSource,
  AiLimitWindow,
  AiModelInfo,
  AiProviderProfile,
} from '../domain/ai-limit.types';
import type { AiCallRecord, AiCallStatus, AiErrorKind, AiUsageRange, AiUsageSummary } from '../domain/ai-usage.types';

/** The provider as the console shows it; no provider name is hard-coded in the console. */
export type AiProviderDto = Pick<AiProviderProfile, 'name' | 'displayName' | 'keyEnv' | 'links'>;

export interface AiStatusDto {
  provider: AiProviderDto;
  configured: boolean;
  /** Last 4 characters of the key, never more (AI-004). */
  keySuffix: string | null;
  billing: AiBilling;
  defaultModel: string;
  lastCall: { at: string; status: AiCallStatus; error: string | null } | null;
}

export type AiTestResultDto =
  | { ok: true; model: string; latencyMs: number }
  | { ok: false; model: string; errorKind: AiErrorKind; message: string };

export type AiUsageDto = AiUsageSummary & { range: AiUsageRange; from: string };

export type AiCallDto = Omit<AiCallRecord, 'createdAt'> & { createdAt: string };

/** One limit row: a documented allowance or the last one the provider reported, with the ledger usage. */
export interface AiLimitDto {
  metric: string;
  label: string;
  kind: AiLimitKind;
  window: AiLimitWindow | null;
  model: string | null;
  limit: number | null;
  /** From the ledger; null when the ledger does not count this kind of limit. */
  used: number | null;
  remaining: number | null;
  resetAt: string | null;
  source: AiLimitSource;
  /** When the provider reported it; null for a documented allowance. */
  observedAt: string | null;
  /** Where a documented allowance comes from, and when it was checked. */
  url: string | null;
  checkedOn: string | null;
}

export type AiModelInfoDto = AiModelInfo & { error: string | null };

export interface AiLimitsDto {
  configured: boolean;
  reportsRateLimits: boolean;
  dailyCap: { capMicroUsd: number; spentMicroUsd: number; resetsAt: string };
  usage: { callsLastMinute: number; callsToday: number; tokensToday: number; searchQueriesThisMonth: number };
  limits: AiLimitDto[];
  models: AiModelInfoDto[];
  /** Why the model list is empty or partial: `not-configured`, or the provider's error. */
  modelsError: string | null;
  /** Credit left; null when the provider does not expose it (or the lookup failed: see `balanceError`). */
  balance: { currency: string; amount: number } | null;
  balanceError: string | null;
}
