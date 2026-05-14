import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Thin reading-progress bar fixed to the top edge of the viewport.
 *
 * Two modes:
 * - **Document mode (default)** — width tracks document scroll progress (0–100%).
 * - **Target mode** — pass `[target]="<HTMLElement>"` to track scroll progress through
 *   a specific article/container (used by blog-detail to ignore header/footer).
 */
@Component({
  selector: 'landing-reading-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onScroll()',
  },
  template: `
    <div class="fixed inset-x-0 top-0 z-40 h-1 bg-landing-border/40" role="progressbar" aria-label="Reading progress">
      <div class="h-full bg-landing-accent transition-[width] duration-150 ease-out" [style.width.%]="progress()"></div>
    </div>
  `,
})
export class LandingReadingProgressComponent {
  readonly target = input<HTMLElement | null>(null);

  private readonly scrollY = signal(0);

  readonly progress = computed(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
    // Read scrollY() so the computed re-evaluates on scroll events.
    this.scrollY();

    const el = this.target();
    if (el) {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return 100;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      return (scrolled / total) * 100;
    }

    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
  });

  onScroll(): void {
    if (typeof window === 'undefined') return;
    this.scrollY.set(window.scrollY);
  }
}
