import { inject, Pipe, PLATFORM_ID, type PipeTransform } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { RichTextWhitelist } from '@portfolio/shared/features/rte-core/constants';
import { sanitizeRichTextBrowser } from './sanitize-browser';

/**
 * Read-time sanitization gate for rich-text HTML.
 *
 * The `*Html` cache bound here is already write-sanitized by the BE
 * (`sanitizeRichText` in rte-core, same `RICH_TEXT_WHITELIST`). On the
 * **server/prerender** we therefore trust the cache as-is and only mark it
 * `SafeHtml` — crucially this keeps `isomorphic-dompurify` (whose top-level
 * `new JSDOM()` breaks the ESM server bundle with `__dirname is not defined`)
 * out of the server graph entirely. In the **browser** we re-run DOMPurify via
 * {@link sanitizeRichTextBrowser} as defense-in-depth (the cache could have been
 * edited, seeded, or written under an older whitelist). DOMPurify is idempotent
 * on already-clean HTML, so the browser pass matches the server output → no
 * hydration mismatch for a correctly write-sanitized cache.
 *
 * `pure: true` — recomputes only when the input string reference changes.
 */
@Pipe({ name: 'safeHtml', pure: true })
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  transform(html: string | null | undefined, whitelist?: RichTextWhitelist): SafeHtml {
    const raw = html ?? '';
    const clean = this.isBrowser ? sanitizeRichTextBrowser(raw, whitelist) : raw;
    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
