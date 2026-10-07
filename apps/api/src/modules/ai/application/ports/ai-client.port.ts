import type { ZodType } from 'zod';

import type { AiFeature, AiRef, AiTokenUsage, AiTrace } from '../../domain/ai-usage.types';

/** One piece of the request: text, a file by URL (public YouTube video, image), or inline bytes. */
export type AiPart =
  | { text: string }
  | { fileUri: string; mimeType?: string }
  | { inlineData: { data: string; mimeType: string } };

/** Built-in tools the provider runs inside the same request; the app never runs a tool loop (AI-001). */
export type AiTool = 'googleSearch' | 'urlContext';

/** Bounds on one request. Required whenever tools are on (AI-002). */
export interface AiLimits {
  maxOutputTokens: number;
  /** Gives up after this long; defaults to the provider's own timeout. */
  timeoutMs?: number;
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
}

/**
 * One structured request to the configured AI provider, recorded in the usage ledger whatever the
 * outcome (AI-003). Throws `AiCallError` on failure.
 */
export interface IAiClient {
  readonly configured: boolean;
  generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>>;
}
