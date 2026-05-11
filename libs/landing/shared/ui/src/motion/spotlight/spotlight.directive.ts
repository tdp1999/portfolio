import { isPlatformBrowser } from '@angular/common';
import { Directive, ElementRef, PLATFORM_ID, inject, input } from '@angular/core';

export type SpotlightScope = 'host' | 'viewport';

/**
 * Cursor-tracking spotlight overlay. On hydration, injects a single
 * `<span class="fx-spotlight__overlay">` inside the host. Pointer moves over
 * the host update CSS variables on the overlay, driving a small radial
 * gradient. Pointer-events disabled on the overlay.
 *
 * Two scopes:
 * - `host` (default) — overlay is `position: absolute` and stays inside the
 *   host's box. Use for per-section / per-card spotlights. Host should be
 *   `position: relative` (the directive enforces this if static).
 * - `viewport` — overlay is `position: fixed` and covers the viewport,
 *   regardless of where the host is in the layout. Use once at the top-level
 *   shell so a single spotlight follows the cursor across the entire site.
 *   Cursor coordinates use `clientX/Y` directly (viewport-relative).
 *
 * Theme-aware: spotlight color is driven by `--fx-spotlight-color`, set per
 * `[data-theme]` in spotlight.scss. SSR-safe — overlay rendered client-side
 * only.
 */
@Directive({
  selector: '[fxSpotlight]',
  standalone: true,
  host: {
    class: 'fx-spotlight',
    '(mousemove)': 'onMove($event)',
    '(mouseleave)': 'onLeave()',
  },
})
export class SpotlightDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Spotlight radius in px. Default 40 (scanner-tight). */
  readonly radius = input<number>(40);
  /** Peak alpha of the spotlight (0..1). Default 0.15. */
  readonly intensity = input<number>(0.15);
  /**
   * `host` keeps the overlay inside the directive's element (absolute position).
   * `viewport` makes the overlay fixed to the viewport — apply once at the
   * highest level (e.g. landing-shell) for a site-wide spotlight.
   */
  readonly scope = input<SpotlightScope>('host');

  private overlay?: HTMLSpanElement;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      queueMicrotask(() => this.injectOverlay());
    }
  }

  private injectOverlay(): void {
    const host = this.el.nativeElement;
    const scope = this.scope();
    if (scope === 'host' && getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }

    const span = document.createElement('span');
    span.className = `fx-spotlight__overlay fx-spotlight__overlay--${scope}`;
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--fx-spotlight-radius', `${this.radius()}px`);
    span.style.setProperty('--fx-spotlight-intensity', String(this.intensity()));
    host.insertBefore(span, host.firstChild);
    this.overlay = span;
  }

  protected onMove(event: MouseEvent): void {
    if (!this.overlay) return;
    let x: number;
    let y: number;
    if (this.scope() === 'viewport') {
      x = event.clientX;
      y = event.clientY;
    } else {
      const rect = this.el.nativeElement.getBoundingClientRect();
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    this.overlay.style.setProperty('--fx-cursor-x', `${x}px`);
    this.overlay.style.setProperty('--fx-cursor-y', `${y}px`);
    this.overlay.style.setProperty('--fx-cursor-opacity', '1');
  }

  protected onLeave(): void {
    this.overlay?.style.setProperty('--fx-cursor-opacity', '0');
  }
}
