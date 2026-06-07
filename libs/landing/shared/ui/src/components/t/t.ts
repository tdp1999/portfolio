import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import { LandingLocaleService } from '../../locale';

/**
 * Bilingual content primitive. Replaces inline `@if (locale() === 'vi')` blocks
 * with a declarative, locale-driven slot switch.
 *
 * ```html
 * <landing-t>
 *   <ng-container en>Let's <em>talk</em>.</ng-container>
 *   <ng-container vi>Hãy nói <em>chuyện</em>.</ng-container>
 * </landing-t>
 * ```
 *
 * **Why this primitive:**
 * - HTML-rich content (accent `<em>`, inline `<landing-link>`, lists, tables)
 *   passes through unchanged — no dictionary mapping.
 * - Grep-able: both languages sit next to each other in the same file.
 * - Signal-driven: re-renders automatically when `LandingLocaleService.locale()`
 *   changes; no manual subscription.
 * - Zero DOM cost: the unselected slot is removed from the DOM, not hidden,
 *   so screen readers only announce the active locale.
 *
 * **Slot tags:**
 * - `[en]` — English content (default fallback when locale is neither en nor vi).
 * - `[vi]` — Vietnamese content.
 *
 * `<ng-container en>` / `<ng-container vi>` is idiomatic (no wrapper element),
 * but any element with the matching attribute works (`<span vi>`, `<p vi>`, etc.).
 *
 * **`[locale]` override** — by default the component reads from the global
 * `LandingLocaleService.locale()`. Pages with their own locale source (legal
 * pages drive locale from `?lang=` URL param, not the site-wide toggle) can
 * pass an explicit signal:
 *
 * ```html
 * <landing-t [locale]="pageLocale()">…</landing-t>
 * ```
 *
 * **Gotcha — direct-child selectors break across the `<landing-t>` boundary.**
 * The host element is real DOM (`:host { display: contents }` only collapses
 * layout, not selector matching). So this BREAKS `.landing-prose > p`:
 *
 * ```html
 * <!-- WRONG — <landing-t> becomes the only direct child -->
 * <div class="landing-prose">
 *   <landing-t>
 *     <p vi>…</p>
 *     <p en>…</p>
 *   </landing-t>
 * </div>
 * ```
 *
 * Put the styling-anchor class INSIDE each locale slot instead:
 *
 * ```html
 * <landing-t>
 *   <div vi class="landing-prose">…vi…</div>
 *   <div en class="landing-prose">…en…</div>
 * </landing-t>
 * ```
 */
@Component({
  selector: 'landing-t',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (effectiveLocale() === 'vi') {
      <ng-content select="[vi]" />
    } @else {
      <ng-content select="[en]" />
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class T {
  /** Optional override. When null/omitted, falls back to global landing locale. */
  readonly locale = input<Locale | null>(null);

  private readonly globalLocale = inject(LandingLocaleService).locale;
  protected readonly effectiveLocale = computed(() => this.locale() ?? this.globalLocale());
}
