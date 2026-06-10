type Segment = { readonly text: string; readonly em: boolean };

const EMPHASIS_PATTERN = /\*([^*]+)\*/g;

/**
 * Parses inline `*word*` markdown into segments — text runs + italic accent runs.
 * Use inside any heading or text node where the author needs to mark accent words
 * via a string field (e.g., dynamic copy from Profile fields).
 *
 * The rendered `<em>` inherits styling from the parent (e.g., `<landing-section-header>`
 * styles `em` indigo + italic-serif). Standalone use renders default italic.
 */
export function parseEmphasis(input: string): readonly Segment[] {
  if (!input) return [];
  const segments: Segment[] = [];
  let cursor = 0;
  EMPHASIS_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EMPHASIS_PATTERN.exec(input))) {
    if (match.index > cursor) {
      segments.push({ text: input.slice(cursor, match.index), em: false });
    }
    segments.push({ text: match[1], em: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), em: false });
  }
  return segments;
}
