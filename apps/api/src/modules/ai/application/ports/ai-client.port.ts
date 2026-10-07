import type { ZodType } from 'zod';

import type { AiBilling } from '../ai.config';
import type { AiFeature, AiRef, AiTokenUsage, AiTrace } from '../../domain/ai-usage.types';

/**
 * How finely the provider samples an image or video frame. Lower is far cheaper (Gemini: 64 instead
 * of 258 tokens per video frame) and still reads slides and on-screen text.
 */
export type AiMediaResolution = 'low' | 'medium' | 'high';

/** One piece of the request: text, a file by URL (public YouTube video, image), or inline bytes. */
export type AiPart =
  | { text: string }
  | { fileUri: string; mimeType?: string; resolution?: AiMediaResolution }
  | { inlineData: { data: string; mimeType: string }; resolution?: AiMediaResolution };

/**
 * Built-in tools the provider runs inside the same request; the app never runs a tool loop (AI-001).
 * Named by what they do, not by any provider's product name, so another provider can map them.
 */
export type AiTool = 'webSearch' | 'readUrls';

/** Reasoning effort, mapped by each provider to its own setting (Gemini: `thinking_level`). */
export type AiEffort = 'minimal' | 'low' | 'medium' | 'high';

/** Bounds on one request. Required whenever tools are on (AI-002). */
export interface AiLimits {
  maxOutputTokens: number;
  /** Gives up after this long; defaults to the provider's own timeout. */
  timeoutMs?: number;
  /** How hard the model reasons before answering; lower is cheaper. Defaults to the provider's own level. */
  effort?: AiEffort;
}

export interface AiStructuredRequest<T> {
  /** Defaults to the configured model. */
  model?: string;
  system: string;
  parts: AiPart[];
  /** The answer is validated with this schema; an answer that fails it is a failed call. */
  schema: ZodType<T>;
  feature: AiFeature;
  ref?: AiRef;
  /** The unit whose budget this call counts against; see `IAiClient.spentMicroUsd`. */
  group?: AiRef;
  tools?: AiTool[];
  limits?: AiLimits;
}

export interface AiStructuredResult<T> {
  data: T;
  model: string;
  usage: AiTokenUsage;
  costMicroUsd: number | null;
  latencyMs: number;
  trace: AiTrace;
  /** Web search queries the provider ran (billed per query, included in `costMicroUsd`). */
  searchQueries: number;
}

/**
 * One structured request to the configured AI provider, recorded in the usage ledger whatever the
 * outcome (AI-003). Throws `AiCallError` on failure.
 */
export interface IAiClient {
  readonly configured: boolean;
  /** The provider's name ("gemini"), for callers that record who produced an answer. */
  readonly provider: string;
  /** `free`: costs are list-price estimates, nothing is charged. `paid`: costs are what the provider bills. */
  readonly billing: AiBilling;
  generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>>;
  /** Recorded cost of every call made for `group`, in micro-USD (list price on the free tier). */
  spentMicroUsd(group: AiRef): Promise<number>;
  /** `spentMicroUsd` for many groups of one type at once; a group with no calls maps to nothing. */
  spentByGroup(type: string, ids: readonly string[]): Promise<Map<string, number>>;
}
