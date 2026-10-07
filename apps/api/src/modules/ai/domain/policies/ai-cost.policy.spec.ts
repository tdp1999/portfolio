import { AiCostPolicy } from './ai-cost.policy';

const usage = { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, cachedTokens: 0, toolTokens: 0 };

describe('AiCostPolicy.costMicroUsd', () => {
  it('should return null for a model missing from the price table', () => {
    expect(AiCostPolicy.costMicroUsd('gemini-unknown', { ...usage, inputTokens: 1000 })).toBeNull();
  });

  it('should charge cached input at the cache price, tools at input and thinking at output', () => {
    // gemini-2.5-flash: input 0.3, cached 0.03, output 2.5 USD per 1M tokens
    const cost = AiCostPolicy.costMicroUsd('gemini-2.5-flash', {
      inputTokens: 1000, // 600 fresh + 400 cached
      cachedTokens: 400,
      toolTokens: 200,
      outputTokens: 100,
      thinkingTokens: 300,
    });
    // (600 + 200) * 0.3 + 400 * 0.03 + (100 + 300) * 2.5 = 240 + 12 + 1000
    expect(cost).toBe(1252);
  });

  it('should add the search fee per query, only for models that price search', () => {
    // gemini-3.1-flash-lite: input 0.25 USD per 1M tokens, search 14 USD per 1,000 queries
    expect(AiCostPolicy.costMicroUsd('gemini-3.1-flash-lite', { ...usage, inputTokens: 1000 }, 2)).toBe(250 + 28_000);
    expect(AiCostPolicy.costMicroUsd('gemini-2.5-flash', usage, 2)).toBe(0);
  });
});
