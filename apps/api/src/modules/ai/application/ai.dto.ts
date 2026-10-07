import type { AiBilling } from './ai.config';
import type { AiCallRecord, AiCallStatus, AiErrorKind, AiUsageRange, AiUsageSummary } from '../domain/ai-usage.types';

export interface AiStatusDto {
  provider: 'gemini';
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
