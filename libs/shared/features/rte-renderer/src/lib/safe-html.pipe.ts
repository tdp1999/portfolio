import { inject, Pipe, type PipeTransform } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { sanitizeRichText } from '@portfolio/shared/features/rte-core';

/**
 * Read-time sanitization gate for rich-text HTML.
 *
 * Runs the shared {@link sanitizeRichText} (DOMPurify + `RICH_TEXT_WHITELIST`,
 * the same allowlist the BE write pipeline uses — belt-and-braces) and only then
 * marks the result trusted for `[innerHTML]`. Never trust the stored HTML
 * directly: the DB cache could have been edited, seeded, or written under an
 * older whitelist.
 *
 * `pure: true` — recomputes only when the input string reference changes.
 * SSR-safe: `sanitizeRichText` uses `isomorphic-dompurify`, no `window`.
 */
@Pipe({ name: 'safeHtml', pure: true })
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(html: string | null | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(sanitizeRichText(html ?? ''));
  }
}
