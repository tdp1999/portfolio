import { parseInlineParagraphs, parseInlineRuns } from './inline-markdown';

describe('parseInlineRuns', () => {
  it('returns [] for empty / whitespace-only input', () => {
    expect(parseInlineRuns('')).toEqual([]);
    expect(parseInlineRuns('   \n  ')).toEqual([]);
  });

  it('returns a single plain run for plain text', () => {
    expect(parseInlineRuns('just words')).toEqual([{ text: 'just words', emphasis: 'plain' }]);
  });

  it('parses **bold** runs', () => {
    expect(parseInlineRuns('I use **Angular** daily')).toEqual([
      { text: 'I use ', emphasis: 'plain' },
      { text: 'Angular', emphasis: 'bold' },
      { text: ' daily', emphasis: 'plain' },
    ]);
  });

  it('parses *italic* runs', () => {
    expect(parseInlineRuns('a *pragmatic* take')).toEqual([
      { text: 'a ', emphasis: 'plain' },
      { text: 'pragmatic', emphasis: 'italic' },
      { text: ' take', emphasis: 'plain' },
    ]);
  });

  it('parses mixed bold and italic in one string', () => {
    expect(parseInlineRuns('**Nx** and *signals*')).toEqual([
      { text: 'Nx', emphasis: 'bold' },
      { text: ' and ', emphasis: 'plain' },
      { text: 'signals', emphasis: 'italic' },
    ]);
  });

  it('collapses internal whitespace and trims the ends', () => {
    expect(parseInlineRuns('  lots\n of   space  ')).toEqual([{ text: 'lots of space', emphasis: 'plain' }]);
  });

  it('handles adjacent tokens with no plain text between', () => {
    expect(parseInlineRuns('**a***b*')).toEqual([
      { text: 'a', emphasis: 'bold' },
      { text: 'b', emphasis: 'italic' },
    ]);
  });

  it('passes unclosed tokens through as literal plain text', () => {
    expect(parseInlineRuns('**bold')).toEqual([{ text: '**bold', emphasis: 'plain' }]);
  });

  it('leaves a stray single asterisk untouched', () => {
    expect(parseInlineRuns('a * b')).toEqual([{ text: 'a * b', emphasis: 'plain' }]);
  });
});

describe('parseInlineParagraphs', () => {
  it('returns [] for empty input', () => {
    expect(parseInlineParagraphs('')).toEqual([]);
  });

  it('splits on blank lines and parses each paragraph', () => {
    expect(parseInlineParagraphs('First **para**.\n\nSecond *para*.')).toEqual([
      [
        { text: 'First ', emphasis: 'plain' },
        { text: 'para', emphasis: 'bold' },
        { text: '.', emphasis: 'plain' },
      ],
      [
        { text: 'Second ', emphasis: 'plain' },
        { text: 'para', emphasis: 'italic' },
        { text: '.', emphasis: 'plain' },
      ],
    ]);
  });

  it('drops empty paragraphs created by extra blank lines', () => {
    expect(parseInlineParagraphs('one\n\n\n\ntwo')).toEqual([
      [{ text: 'one', emphasis: 'plain' }],
      [{ text: 'two', emphasis: 'plain' }],
    ]);
  });
});
