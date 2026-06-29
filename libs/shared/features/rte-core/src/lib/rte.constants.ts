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
  ALLOWED_ATTR: ['href', 'target', 'rel', 'data-block', 'data-image-id', 'data-variant', 'id'],
} as const;

/** Tags `id` may survive on — every other element is stripped of it by the
 *  sanitize hook (ToC anchors only; keeps `id` off `<a>` etc.). */
export const ID_ALLOWED_TAGS = ['H2', 'H3', 'H4'] as const;

export type RichTextWhitelist = {
  ALLOWED_TAGS: readonly string[];
  ALLOWED_ATTR: readonly string[];
};
