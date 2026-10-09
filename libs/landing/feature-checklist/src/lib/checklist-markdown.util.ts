import { Marked } from 'marked';

// GFM for the lookup table's tables; single newlines stay soft, as in the source files.
const markdown = new Marked({ async: false, gfm: true });

/**
 * A lookup or profile section's markdown as HTML. The files are the Owner's own, but the string is
 * still bound through `[innerHTML]` so Angular sanitizes it.
 */
export function renderSectionMarkdown(value: string): string {
  return markdown.parse(value) as string;
}
