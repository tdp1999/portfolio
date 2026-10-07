import { AiModelPrice, AiTokenUsage } from '../ai-usage.types';

/** What a model costs per token, and what one call cost. */
export class AiCostPolicy {
  // --- Constants ---

  /**
   * Gemini list prices for text, image and video input, prompts up to 200k tokens.
   * Checked 2026-10-07 on ai.google.dev/gemini-api/docs/pricing; update this table when prices change.
   * Web search on Gemini 3.x is $14 per 1,000 queries after 5,000 free queries a month; the free
   * queries are not subtracted, so the cost is an upper bound and a run budget never undercounts.
   */
  static readonly PRICES: Readonly<Record<string, AiModelPrice>> = {
    'gemini-3.8-flash': { input: 0.75, output: 3.75, cachedInput: 0.075, webSearchPer1k: 14 },
    'gemini-3.7-flash': { input: 0.75, output: 3.75, cachedInput: 0.075, webSearchPer1k: 14 },
    'gemini-3.6-flash': { input: 0.75, output: 3.75, cachedInput: 0.075, webSearchPer1k: 14 },
    'gemini-3.5-flash': { input: 1.5, output: 9, cachedInput: 0.15, webSearchPer1k: 14 },
    'gemini-3.5-flash-lite': { input: 0.3, output: 2.5, cachedInput: 0.03, webSearchPer1k: 14 },
    'gemini-3.1-flash-lite': { input: 0.25, output: 1.5, cachedInput: 0.025, webSearchPer1k: 14 },
    'gemini-3.1-pro-preview': { input: 2, output: 12, cachedInput: 0.2, webSearchPer1k: 14 },
    'gemini-2.5-pro': { input: 1.25, output: 10, cachedInput: 0.125 },
    'gemini-2.5-flash': { input: 0.3, output: 2.5, cachedInput: 0.03 },
    'gemini-2.5-flash-lite': { input: 0.1, output: 0.4, cachedInput: 0.01 },
  };

  // --- Rules ---

  /** A model with a price: only those may be called by name, so the daily cap sees every call. */
  static isPriced(model: string): boolean {
    return Object.hasOwn(AiCostPolicy.PRICES, model);
  }

  /**
   * Cost of one call in micro-USD, or null when the model has no price. Cached input is charged at
   * the cache price, tool tokens at the input price, thinking at the output price, and each web
   * search query at the model's search fee.
   * USD per million tokens times tokens is micro-USD, so no unit conversion is needed; USD per
   * 1,000 queries is 1,000 micro-USD per query.
   */
  static costMicroUsd(model: string, usage: AiTokenUsage, searchQueries = 0): number | null {
    const price = AiCostPolicy.PRICES[model];
    if (!price) return null;
    const freshInput = Math.max(0, usage.inputTokens - usage.cachedTokens) + usage.toolTokens;
    return Math.round(
      freshInput * price.input +
        usage.cachedTokens * price.cachedInput +
        (usage.outputTokens + usage.thinkingTokens) * price.output +
        searchQueries * (price.webSearchPer1k ?? 0) * 1000
    );
  }
}
