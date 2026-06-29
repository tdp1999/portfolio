/**
 * The single source of truth for which HTML the rich-text pipeline may emit.
 *
 * Shared verbatim by **both** sanitization layers — the BE write-time pipeline
 * (`RichTextService`, task 310) and the FE read-time renderer (`<rte-render-html>`,
 * task 308) — so write and read can never drift. Both run `sanitizeRichText`,
 * which keys on this list.
 *
 * It is intentionally minimal. Tasks that need extra tags/attrs must **import and
 * extend** it additively at the call site — never fork or redefine it. Call-site
 * extensions then apply to both BE and FE because both read the same base.
 *
 * `id` is allowed (task 313) so ToC anchors survive sanitization, but
 * {@link sanitizeRichText}'s hook strips it from every element except
 * `h2`/`h3`/`h4` — keeping it off `<a>` (anchor spoofing) and everything else.
 *
 * `data-caption-position` is allowed (task 315) because the `image-ref` node's
 * `renderHTML` emits it on the `<figure>` at BE write-time — without it the
 * sanitizer would strip the caption-order hint from the stored HTML cache before
 * the landing renderer ever sees it. The figure stays URL-free here; the resolved
 * `<img>` is injected read-time on landing (see {@link RICH_TEXT_MEDIA_WHITELIST}).
 *
 * Shape matches DOMPurify's config keys so it can be spread straight into
 * `DOMPurify.sanitize(html, RICH_TEXT_WHITELIST)`.
 */
export const RICH_TEXT_WHITELIST = {
  ALLOWED_TAGS: [
    'p',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'figure',
    'figcaption',
    'strong',
    'em',
    'u',
    's',
    'a',
    'br',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'data-block', 'data-image-id', 'data-caption-position', 'data-variant', 'id'],
} as const;

/**
 * Read-time extension of {@link RICH_TEXT_WHITELIST} that additionally permits the
 * `<img>` an `image-ref` figure is hydrated with on landing (task 315).
 *
 * The stored HTML cache is deliberately URL-free — `image-ref` figures hold only
 * `data-image-id`. At read-time the landing renderer resolves each id to a media
 * URL and rebuilds the figure into the `landing-figure` primitive (a `<div>` frame
 * + `<img src srcset alt>` + a mono-caps `FIG. 0X` caption) via `hydrateImageRefs`.
 * That injected markup must survive the renderer's defense-in-depth re-sanitize, so
 * this list adds `img`/`div` + the figure's presentational attrs (incl. `class` for
 * the `landing-figure*` styling hooks) on top of the base. It is **never** used by
 * the BE write pipeline — keeping the persisted cache provably free of resolved
 * URLs and presentation.
 */
export const RICH_TEXT_MEDIA_WHITELIST = {
  ALLOWED_TAGS: [...RICH_TEXT_WHITELIST.ALLOWED_TAGS, 'img', 'div'],
  ALLOWED_ATTR: [...RICH_TEXT_WHITELIST.ALLOWED_ATTR, 'src', 'srcset', 'alt', 'width', 'height', 'loading', 'class'],
} as const;

/** Tags `id` may survive on — every other element is stripped of it by the
 *  sanitize hook (ToC anchors only; keeps `id` off `<a>` etc.). */
export const ID_ALLOWED_TAGS = ['H2', 'H3', 'H4'] as const;

export type RichTextWhitelist = {
  ALLOWED_TAGS: readonly string[];
  ALLOWED_ATTR: readonly string[];
};
