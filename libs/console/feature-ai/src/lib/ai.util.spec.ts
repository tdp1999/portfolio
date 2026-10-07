import { formatCost, formatLatency, formatTokens, toolSummary } from './ai.util';

describe('formatCost', () => {
  it.each([
    [null, 'No price'],
    [0, '$0'],
    [18, '$0.000018'],
    [12_345, '$0.0123'],
    [1_234_567, '$1.23'],
  ])('formats %s micro-USD as %s', (micro, text) => {
    expect(formatCost(micro)).toBe(text);
  });
});

describe('formatTokens / formatLatency / toolSummary', () => {
  it('shortens large counts and seconds', () => {
    expect(formatTokens(950)).toBe('950');
    expect(formatTokens(12_400)).toBe('12.4K');
    expect(formatLatency(901)).toBe('901 ms');
    expect(formatLatency(29_823)).toBe('29.8 s');
  });

  it('names only the tools a call used', () => {
    expect(toolSummary(0, 0)).toBeNull();
    expect(toolSummary(1, 3)).toBe('1 search, 3 pages read');
  });
});
