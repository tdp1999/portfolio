import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'landing-scroll-to-top',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
  },
  template: `
    @if (visible()) {
      <button
        type="button"
        (click)="scrollToTop()"
        [class.h-12]="!compact()"
        [class.w-12]="!compact()"
        [class.bottom-6]="!compact()"
        [class.h-10]="compact()"
        [class.w-10]="compact()"
        [class.bottom-24]="compact()"
        class="fixed right-6 z-40 flex items-center justify-center rounded-full border border-landing-border bg-[var(--landing-header-bg)] text-landing-text-300 backdrop-blur-md shadow-lg transition-all duration-motion-base ease-landing-ease hover:border-landing-accent hover:text-landing-accent"
        aria-label="Scroll to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    }
  `,
})
export class ScrollToTop {
  readonly threshold = input(400);
  /**
   * Distance (px) from the bottom of the document at which the button enters its
   * "compact" state — it shrinks and lifts so it clears the footer's social icons
   * instead of sitting on top of them. ~footer height.
   */
  readonly footerGap = input(280);

  readonly visible = signal(false);
  /** Near the footer → smaller + raised so it doesn't overlap the social row. */
  readonly compact = signal(false);

  onScroll(): void {
    if (typeof window === 'undefined') return;

    const y = window.scrollY;
    const next = y > this.threshold();
    if (next !== this.visible()) this.visible.set(next);

    const distanceFromBottom = document.documentElement.scrollHeight - (y + window.innerHeight);
    const nearFooter = distanceFromBottom < this.footerGap();
    if (nearFooter !== this.compact()) this.compact.set(nearFooter);
  }

  scrollToTop(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
