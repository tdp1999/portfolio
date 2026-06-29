import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import { buildCloudinarySrcset } from './cloudinary-srcset';
import { decodeHtml, escAttr } from './html-text';

// Match a whole <figure>…</figure>. Non-greedy body; image-ref figures are atoms
// (no nested <figure>), so this never over-captures.
const FIGURE_RE = /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi;
// Attribute lookups are order-independent — Tiptap's `mergeAttributes` does not
// guarantee a fixed attribute order on the serialized <figure>.
const IMAGE_REF_RE = /data-block\s*=\s*"image-ref"/i;
const IMAGE_ID_RE = /data-image-id\s*=\s*"([^"]*)"/i;
const FIGCAPTION_RE = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i;

// Rendered CSS width of a prose image (used only to size the Cloudinary 1×/2×
// srcset variants — Cloudinary `c_limit` never upscales past the source).
const PROSE_IMAGE_WIDTH = 800;

/**
 * Hydrate the `image-ref` figures of a pre-rendered rich-text HTML string into the
 * `landing-figure` primitive (RTE epic Phase 7 / task 316).
 *
 * The stored HTML cache is URL-free: an `image-ref` block is
 * `<figure data-block="image-ref" data-image-id="…">` with only an optional
 * `<figcaption>` text — never an `<img>` (the document is decoupled from media
 * URLs). This read-time pass resolves each `data-image-id` against the `mediaRefs`
 * map the BE shipped with the document and rebuilds the figure as a
 * `landing-figure` (a `<div>` frame + responsive `<img>` + a mono-caps
 * `FIG. 0X · CAPTION` caption), matching the landing primitive so styling stays
 * consistent. Caption numbering is computed per call (i.e. per page): contiguous
 * `01, 02, …` across the captioned figures in document order.
 *
 * Mirrors {@link addHeadingAnchors}: pure string/regex, SSR-safe, no DOM — so the
 * server and client produce identical HTML and the first paint already contains the
 * image. The injected markup survives `<rte-render-html>`'s browser re-sanitize only
 * when the renderer is given `[allowMedia]="true"` (which widens the whitelist to
 * permit `img`/`div`/`class`).
 *
 * If an id has no entry in the map (e.g. the media was deleted), the figure still
 * renders — as a broken `<img>` carrying the caption as its `alt` — rather than
 * silently vanishing (per the epic's deleted-media risk row).
 *
 * NOTE: this string path is the sanctioned **interim** for the single `image-ref`
 * block; the prose-block-renderer epic later replaces it with an AST renderer that
 * mounts the real `<landing-figure>` component (and adds the in-content lightbox).
 */
export function hydrateImageRefs(html: string, mediaRefs: MediaRefMap | null | undefined): string {
  if (!html || !mediaRefs) return html;

  let figNumber = 0;

  return html.replace(FIGURE_RE, (full: string, attrs: string, inner: string) => {
    if (!IMAGE_REF_RE.test(attrs)) return full;

    const id = attrs.match(IMAGE_ID_RE)?.[1];
    if (!id) return full;

    // Caption is the figcaption's (already HTML-escaped) text content, stored in
    // the document and independent of the media — so it survives a deleted asset.
    const captionHtml = inner.match(FIGCAPTION_RE)?.[1]?.trim() ?? '';

    const ref = mediaRefs[id];
    const { src, srcset } = ref ? buildCloudinarySrcset(ref.url, PROSE_IMAGE_WIDTH) : { src: '', srcset: '' };
    // Alt prefers the media's own alt text; falls back to the caption (decoded
    // back to plain text, then attr-escaped) so a deleted asset still reads.
    const alt = escAttr(ref?.alt || decodeHtml(captionHtml) || '');

    const srcAttr = src ? ` src="${escAttr(src)}"` : '';
    const srcsetAttr = srcset ? ` srcset="${escAttr(srcset)}"` : '';
    const dimsAttr = ref
      ? (ref.width ? ` width="${ref.width}"` : '') + (ref.height ? ` height="${ref.height}"` : '')
      : '';
    const img = `<img${srcAttr}${srcsetAttr} alt="${alt}"${dimsAttr} loading="lazy" />`;

    let figcaption = '';
    if (captionHtml) {
      const n = ++figNumber;
      const label = n < 10 ? `0${n}` : String(n);
      figcaption =
        `<figcaption class="landing-figure__caption">` +
        `<span class="landing-figure__number">FIG. ${label}</span>` +
        `<span class="landing-figure__sep" aria-hidden="true">·</span>` +
        `<span class="landing-figure__text">${captionHtml}</span>` +
        `</figcaption>`;
    }

    return (
      `<figure class="landing-figure">` + `<div class="landing-figure__frame">${img}</div>` + figcaption + `</figure>`
    );
  });
}
