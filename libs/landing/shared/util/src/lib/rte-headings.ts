import { decodeHtml, escAttr, slugify } from './html-text';

/** A heading surfaced in a table of contents. `level` mirrors the `h2`/`h3` depth. */
export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

/** Result of {@link addHeadingAnchors}: the HTML with heading ids injected, plus the ToC. */
export type RenderedHeadings = {
  html: string;
  toc: TocEntry[];
};

const HEADING_RE = /<(h[234])\b([^>]*)>([\s\S]*?)<\/\1>/gi;
// Anchored to an attribute-name boundary (start-of-string or whitespace) so it
// matches a real `id=` attribute but NOT `data-image-id=` / any `*-id=` — a bare
// `\bid=` false-positives there because `\b` matches the `-`→`i` boundary.
const ID_ATTR_RE = /(^|\s)id\s*=/i;

/**
 * Add stable `id` anchors to the `h2`/`h3`/`h4` of a pre-rendered rich-text HTML
 * string and extract the ToC (`h2`/`h3` only, matching {@link TocEntry}).
 *
 * The RTE write pipeline (`generateHTML`, Tiptap) emits bare `<h2>…</h2>` with no
 * `id`, so the sticky ToC + scrollspy have nothing to target. This read-time slugger
 * adds them so `<rte-render-html>` can render the body as-is. Slug rules + dedup match
 * the slugify helper in `@portfolio/landing/shared/util`, so anchors stay stable.
 *
 * SSR-safe: pure string/regex, no DOM. The `id`s survive `<rte-render-html>`'s
 * re-sanitize because `RICH_TEXT_WHITELIST` allows `id` on headings.
 */
export function addHeadingAnchors(html: string): RenderedHeadings {
  if (!html) return { html: '', toc: [] };

  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();

  const out = html.replace(HEADING_RE, (full, tag: string, attrs: string, inner: string) => {
    const depth = Number(tag[1]) as 2 | 3 | 4;
    const text = decodeHtml(inner.replace(/<[^>]+>/g, '')).trim();

    // Respect an id the author somehow already set; otherwise slug + dedup.
    if (ID_ATTR_RE.test(attrs)) return full;

    let id = slugify(text) || `heading-${toc.length + 1}`;
    let suffix = 1;
    while (usedIds.has(id)) id = `${id}-${++suffix}`;
    usedIds.add(id);

    if (depth === 2 || depth === 3) toc.push({ id, text, level: depth });

    return `<${tag}${attrs} id="${escAttr(id)}">${inner}</${tag}>`;
  });

  return { html: out, toc };
}
