/**
 * Obsidian → Markdown pure helpers. This module owns the legacy
 * Markdown-massaging logic (Obsidian syntax → CommonMark, title extraction,
 * image flagging) and is deliberately **dependency-free** — no Markdown engine,
 * no editor schema — so it can be unit-tested directly and never drags ESM into
 * the api jest env. The ESM-heavy Markdown→editor-JSON conversion lives in the
 * sibling `markdown-to-doc.ts`.
 *
 * These utilities used to ship in the console runtime lib; task 318 moved them
 * here so the importer is their sole owner and they stay out of FE bundles.
 */

const H1_LINE = /^\s*#\s+(.+?)\s*$/m;

export interface ConvertResult {
  content: string;
  warnings: string[];
}

/**
 * Convert Obsidian-flavoured Markdown to standard CommonMark.
 *
 * - `==highlight==` → `<mark>` (Tiptap Highlight mark on the way in).
 * - `> [!note]`/`[!warning]` callouts → plain blockquote (marker stripped).
 * - **All** images (Obsidian `![[embed]]` and Markdown `![alt](src)` — local
 *   *and* remote) are **removed** and reported as a single warning. Image-ref /
 *   Media wiring is deferred, so we never inject a raw `<img>`: a remote URL
 *   would render a broken, hard-to-delete node in the editor, and a local path
 *   would 404. The author re-inserts images via the picker.
 */
export function convertObsidianMarkdown(raw: string): ConvertResult {
  let content = raw;
  let imageCount = 0;
  const countAndDrop = () => {
    imageCount++;
    return '';
  };

  // ==highlight== -> <mark>highlight</mark>
  content = content.replace(/==([^=]+)==/g, '<mark>$1</mark>');

  // > [!note] / > [!warning] etc -> blockquote (strip callout marker)
  content = content.replace(/>\s*\[!\w+\][^\n]*\n?/g, '> ');

  // Drop Obsidian embeds ![[...]] and every Markdown image ![alt](src).
  content = content.replace(/!\[\[[^\]]+\]\]/g, countAndDrop);
  content = content.replace(/!\[[^\]]*\]\([^)]+\)/g, countAndDrop);

  const warnings =
    imageCount > 0
      ? [
          `${imageCount} image${imageCount === 1 ? '' : 's'} skipped — re-insert ${
            imageCount === 1 ? 'it' : 'them'
          } with the image button.`,
        ]
      : [];

  return { content, warnings };
}

/** First `# H1` line of a Markdown document, used as the post title. */
export function extractTitleFromMarkdown(content: string): string | null {
  const match = content.match(H1_LINE);
  return match ? match[1].trim() : null;
}

/** Drop the first `# H1` line so the title is not duplicated in the body. */
export function stripFirstH1(content: string): string {
  return content.replace(H1_LINE, '').replace(/^\s*\n/, '');
}
