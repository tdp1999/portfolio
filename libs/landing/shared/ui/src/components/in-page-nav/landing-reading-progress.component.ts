import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';

/**
 * Thin reading-progress bar fixed to the top edge of the viewport.
 * Width tracks document scroll progress (0–100%).
 */
@Component({
  selector: 'landing-reading-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-x-0 top-0 z-40 h-1 bg-landing-border/40" role="progressbar" aria-label="Reading progress">
      <div class="h-full bg-landing-accent transition-[width] duration-150 ease-out" [style.width.%]="progress()"></div>
    </div>
  `,
})
export class LandingReadingProgressComponent {
  private readonly scrollY = signal(0);

  readonly progress = computed(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(100, (this.scrollY() / max) * 100) : 0;
  });

  @HostListener('window:scroll')
  onScroll(): void {
    if (typeof window === 'undefined') return;
    this.scrollY.set(window.scrollY);
  }
}
