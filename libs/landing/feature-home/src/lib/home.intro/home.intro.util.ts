import type { Paragraph, Run } from './home.intro.types';
import { ITALIC_PATTERN } from './home.intro.data';

/**
 * Parses Owner-authored bioLong markdown into render-ready paragraphs.
 * - Paragraphs split on blank lines.
 * - `*phrase*` → italic emphasis run (Newsreader serif at render time).
 *
 * Kept inside the component because the parse is rendering-only: the source
 * stays in `Profile.bioLong` (per E5 content guardrail — no hardcoded copy).
 */
export function parseBioLong(source: string): readonly Paragraph[] {
  if (!source) return [];
  return source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map<Paragraph>((block) => {
      const runs: Run[] = [];
      let cursor = 0;
      const text = block.replace(/\s+/g, ' ');
      ITALIC_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = ITALIC_PATTERN.exec(text))) {
        if (match.index > cursor) {
          runs.push({ text: text.slice(cursor, match.index), italic: false });
        }
        runs.push({ text: match[1], italic: true });
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) {
        runs.push({ text: text.slice(cursor), italic: false });
      }
      return runs;
    });
}
