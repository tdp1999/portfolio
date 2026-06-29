import DOMPurify from 'isomorphic-dompurify';
import { ID_ALLOWED_TAGS, RICH_TEXT_WHITELIST, type RichTextWhitelist } from './rte.constants';

// `isomorphic-dompurify` runs the real DOMPurify in the browser and a jsdom-backed
// DOMPurify in Node — so this one function sanitizes identically on the server
// (SSR pre-render, BE write pipeline) and the client. No `window` reference here.

// DOMPurify hooks are process-global; register the anchor-hardening hook exactly
// once. Every sanitized `<a href>` is forced to open in a new tab with a safe
// `rel`, regardless of what the source markup said. DOMPurify already drops
// `javascript:` URLs, so a surviving `<a>` is guaranteed http(s)/mailto/tel.
let anchorHookRegistered = false;
function ensureAnchorHook(): void {
  if (anchorHookRegistered) return;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element;
    if (node.nodeName === 'A' && el.hasAttribute('href')) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener nofollow');
    }
    // `id` is whitelisted only so ToC heading anchors survive — strip it from
    // every other element (e.g. `<a>`, to block anchor spoofing).
    if (el.hasAttribute?.('id') && !ID_ALLOWED_TAGS.includes(node.nodeName as (typeof ID_ALLOWED_TAGS)[number])) {
      el.removeAttribute('id');
    }
  });
  anchorHookRegistered = true;
}

/**
 * Sanitize a rich-text HTML string against {@link RICH_TEXT_WHITELIST}.
 *
 * This is the shared gate for both the BE write-time pipeline and the FE
 * read-time renderer. Pass a `whitelist` override to extend the base list at a
 * call site (e.g. allowing `id` on headings for ToC anchors) — extensions apply
 * to whichever layer calls it, keeping write/read in parity.
 */
export function sanitizeRichText(html: string, whitelist: RichTextWhitelist = RICH_TEXT_WHITELIST): string {
  ensureAnchorHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [...whitelist.ALLOWED_TAGS],
    ALLOWED_ATTR: [...whitelist.ALLOWED_ATTR],
  });
}
