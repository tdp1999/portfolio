import type { AiErrorKind } from '../domain/ai-usage.types';

/**
 * A failed AI call, typed so callers decide without reading provider text: a retryable error
 * (`rate-limited`, `unavailable`) means leave the work pending and try on a later tick, the other
 * kinds mean the work failed.
 */
export class AiCallError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    /** Set on `rate-limited` when the provider said how long to wait. */
    readonly retryAfterMs: number | null = null
  ) {
    super(message);
    this.name = 'AiCallError';
  }

  /** The provider is busy, not the request wrong: try again later. */
  get retryable(): boolean {
    return this.kind === 'rate-limited' || this.kind === 'unavailable';
  }
}
