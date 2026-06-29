import * as DOMPurifyModule from 'dompurify';
// Import constants from the constants-only entry, NOT the rte-core barrel: the
// barrel re-exports `rte.sanitize`, which top-level-imports `isomorphic-dompurify`
// (jsdom). Pulling that into the server bundle is exactly the `__dirname` crash
// this module exists to avoid.
import { ID_ALLOWED_TAGS, RICH_TEXT_WHITELIST } from '@portfolio/shared/features/rte-core/constants';

// Browser-only read-time sanitize.
//
// Uses plain `dompurify`, NOT `isomorphic-dompurify`. isomorphic-dompurify runs
// `new JSDOM()` at module top-level, and jsdom's CommonJS `__dirname` reference
// crashes Angular's ESM SSR/prerender bundle. Plain dompurify instead *no-ops
// gracefully* when no `window` is present (it never touches jsdom), so importing
// it is safe in the server bundle; the sanitize itself only runs in the browser
// (see SafeHtmlPipe's platform guard), where the module-load-time instance is
// bound to the real `window`.
//
// The default-export interop differs between bundlers (esbuild ESM build vs
// ts-jest's CJS `module.exports = purify`), so resolve it defensively.
//
// Hardening + whitelist mirror rte-core's `sanitizeRichText` exactly so the read
// gate stays in parity with the BE write gate.

const DOMPurify = ((DOMPurifyModule as { default?: unknown }).default ??
  DOMPurifyModule) as typeof import('dompurify').default;

let hooksRegistered = false;
function ensureHooks(): void {
  if (hooksRegistered) return;
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
  hooksRegistered = true;
}

export function sanitizeRichTextBrowser(html: string): string {
  ensureHooks();
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: [...RICH_TEXT_WHITELIST.ALLOWED_TAGS],
    ALLOWED_ATTR: [...RICH_TEXT_WHITELIST.ALLOWED_ATTR],
  });
}
