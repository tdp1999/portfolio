/** The model used when a caller names none. Override with `AI_GEMINI_MODEL`. */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

export type AiBilling = 'free' | 'paid';

export interface AiConfig {
  /** Null when `GEMINI_API_KEY` is unset: AI calls are refused, the rest of the app still works. */
  geminiApiKey: string | null;
  /** `free`: costs are list-price estimates, nothing is charged. */
  billing: AiBilling;
  defaultModel: string;
}

/** Reads the AI settings. The key stays inside the provider and the client; no endpoint returns it (AI-004). */
export function loadAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  return {
    geminiApiKey: env['GEMINI_API_KEY']?.trim() || null,
    billing: env['AI_GEMINI_BILLING']?.trim() === 'paid' ? 'paid' : 'free',
    defaultModel: env['AI_GEMINI_MODEL']?.trim() || DEFAULT_GEMINI_MODEL,
  };
}

/** The last 4 characters, enough to tell two keys apart without revealing either. */
export function maskKey(key: string | null): string | null {
  return key ? `…${key.slice(-4)}` : null;
}
