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
        class="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-landing-border bg-[var(--landing-header-bg)] text-landing-text-300 backdrop-blur-md shadow-lg transition-all duration-motion-base ease-landing-ease hover:border-landing-accent hover:text-landing-accent"
        aria-label="Scroll to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    }
  `,
})
export class LandingScrollToTopComponent {
  readonly threshold = input(400);
  readonly visible = signal(false);

  onScroll(): void {
    if (typeof window === 'undefined') return;
    const next = window.scrollY > this.threshold();
    if (next !== this.visible()) this.visible.set(next);
  }

  scrollToTop(): void {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
