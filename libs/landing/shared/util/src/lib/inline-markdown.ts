/**
 * Declarative inline-markdown parsing for landing's short authored fields.
 *
 * Short fields (stackIntro §5, project description/motivation, …) are plain
 * strings carrying a tiny CommonMark subset: `**bold**` and `*italic*`. Rather
 * than render them through an HTML pipe (`marked` + DOMPurify + `[innerHTML]`),
 * landing parses each field into a flat list of typed {@link InlineRun}s and the
 * template emits real `<strong>`/`<em>` elements declaratively. No `[innerHTML]`,
 * no DOMPurify, no markdown dependency — the XSS surface is structurally zero and
 * the model matches the prose-block epic's D5b (inline marks rendered as nested
 * real elements, never an injected HTML string).
 *
 * This is the single source for short-field inline markup. Only the parsing lives
 * here; per-consumer styling stays in each component (the `<strong>`/`<em>` classes
 * differ by section).
 */
export type InlineEmphasis = 'plain' | 'bold' | 'italic';

export interface InlineRun {
  readonly text: string;
  readonly emphasis: InlineEmphasis;
}

// `**bold**` (group 1) | `*italic*` (group 2). Single level only — no nesting,
// matching the authored convention (E2 §4 bold tech names, E5 italic emphasis).
const TOKEN_PATTERN = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/**
 * Parse one line/block of inline markdown into typed runs. Collapses internal
 * whitespace to single spaces (the source may be soft-wrapped) and trims the ends.
 * Returns `[]` for empty input.
 */
export function parseInlineRuns(source: string): readonly InlineRun[] {
  if (!source) return [];
  const text = source.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const runs: InlineRun[] = [];
  let cursor = 0;
  TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_PATTERN.exec(text))) {
    if (match.index > cursor) {
      runs.push({ text: text.slice(cursor, match.index), emphasis: 'plain' });
    }
    if (match[1] !== undefined) {
      runs.push({ text: match[1], emphasis: 'bold' });
    } else {
      runs.push({ text: match[2], emphasis: 'italic' });
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    runs.push({ text: text.slice(cursor), emphasis: 'plain' });
  }
  return runs;
}

/**
 * Parse multi-paragraph inline markdown: split on blank lines, each paragraph
 * parsed via {@link parseInlineRuns}. Empty paragraphs are dropped. Used where a
 * field renders as a stack of `<p>` blocks (e.g. stackIntro §5).
 */
export function parseInlineParagraphs(source: string): readonly (readonly InlineRun[])[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => parseInlineRuns(block))
    .filter((runs) => runs.length > 0);
}
