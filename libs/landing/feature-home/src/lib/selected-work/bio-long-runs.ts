/**
 * Splits a description into runs, marking `*phrase*` segments as italic
 * (Newsreader serif at render). Used by Selected Work text + fallback
 * variants, mirroring the rule established in `home-intro`.
 */
export type Run = { readonly text: string; readonly italic: boolean };

const ITALIC_PATTERN = /\*([^*]+)\*/g;

export function parseItalicRuns(source: string): readonly Run[] {
  if (!source) return [];
  const text = source.replace(/\s+/g, ' ').trim();
  const runs: Run[] = [];
  let cursor = 0;
  ITALIC_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ITALIC_PATTERN.exec(text))) {
    if (match.index > cursor) runs.push({ text: text.slice(cursor, match.index), italic: false });
    runs.push({ text: match[1], italic: true });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), italic: false });
  return runs;
}
