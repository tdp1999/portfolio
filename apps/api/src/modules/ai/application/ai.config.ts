/** The model used when a caller names none. Override with `AI_GEMINI_MODEL`. */
export const DEFAULT_AI_MODEL = 'gemini-3.8-flash';

/** Spend cap per UTC day across every AI feature. Override with `AI_DAILY_CAP_USD`. */
export const DEFAULT_AI_DAILY_CAP_USD = 1;

export type AiBilling = 'free' | 'paid';

export interface AiConfig {
  /**
   * The provider's API key (today `GEMINI_API_KEY`). Null when unset: AI calls are refused, the rest
   * of the app still works. Env names are read only here, so a new provider changes this file and its adapter.
   */
  apiKey: string | null;
  /** `free`: costs are list-price estimates, nothing is charged. */
  billing: AiBilling;
  defaultModel: string;
  /** Recorded spend per UTC day after which every call is refused, in micro-USD. */
  dailyCapMicroUsd: number;
}

/** Reads the AI settings. The key stays inside the provider and the client; no endpoint returns it (AI-004). */
export function loadAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  return {
    apiKey: env['GEMINI_API_KEY']?.trim() || null,
    billing: env['AI_GEMINI_BILLING']?.trim() === 'paid' ? 'paid' : 'free',
    defaultModel: env['AI_GEMINI_MODEL']?.trim() || DEFAULT_AI_MODEL,
    dailyCapMicroUsd: Math.round(usd(env['AI_DAILY_CAP_USD'], DEFAULT_AI_DAILY_CAP_USD) * 1_000_000),
  };
}

/** A positive dollar amount from the env, or the fallback. */
function usd(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** The last 4 characters, enough to tell two keys apart without revealing either. */
export function maskKey(key: string | null): string | null {
  return key ? `…${key.slice(-4)}` : null;
}
