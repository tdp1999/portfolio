/**
 * The single source of truth for which HTML the rich-text pipeline may emit.
 *
 * Shared verbatim by **both** sanitization layers — the BE write-time pipeline
 * (`RichTextService`, task 310) and the FE read-time renderer (`<rte-render-html>`,
 * task 308) — so write and read can never drift. Both run `sanitizeRichText`,
 * which keys on this list.
 *
 * It is intentionally minimal. Tasks that need extra tags/attrs (e.g. task 313
 * adds `id` on `h2`–`h4` for ToC anchors) must **import and extend** it
 * additively at the call site — never fork or redefine it. Call-site extensions
 * then apply to both BE and FE because both read the same base.
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
  ALLOWED_ATTR: ['href', 'target', 'rel', 'data-block', 'data-image-id', 'data-variant'],
} as const;

export type RichTextWhitelist = {
  ALLOWED_TAGS: readonly string[];
  ALLOWED_ATTR: readonly string[];
};
