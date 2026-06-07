import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const MIN_DISPLAY_MS = 250;

/**
 * Top-of-viewport 2px progress bar that shows during router navigations. Fixes the
 * "click → 10s of nothing → page snaps" feel on slow networks: Angular Router doesn't
 * commit a navigation (no URL change, no component swap) until lazy chunks + guards +
 * resolvers all complete. This bar gives the user immediate feedback that something is
 * happening.
 *
 * Mount once in the app root (above `<router-outlet />`). No props.
 *
 * Behavior:
 * - `NavigationStart` → bar visible (no delay — every click should give feedback).
 * - `NavigationEnd | Cancel | Error` → bar hides, but stays visible at least `MIN_DISPLAY_MS`
 *   so fast navs don't produce a single-frame flicker.
 */
@Component({
  selector: 'landing-router-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="router-progress"
      [class.router-progress--visible]="visible()"
      [attr.aria-hidden]="!visible()"
      role="progressbar"
      aria-label="Loading next page"
    >
      <div class="router-progress__bar"></div>
    </div>
  `,
  styles: `
    @use 'base/prefers' as prefers;
    .router-progress {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease-out;
      overflow: hidden;
    }
    .router-progress--visible {
      opacity: 1;
    }
    .router-progress__bar {
      height: 100%;
      width: 40%;
      background: currentColor;
      color: var(--landing-accent, #6366f1);
      animation: router-progress-slide 1.1s ease-in-out infinite;
    }
    @keyframes router-progress-slide {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(350%);
      }
    }
    .router-progress__bar {
      @include prefers.reduce-motion {
        animation-duration: 2.4s;
      }
    }
  `,
})
export class RouterProgress {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly visible = signal(false);

  private shownAt = 0;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.show();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.scheduleHide();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.hideTimeout !== null) clearTimeout(this.hideTimeout);
    });
  }

  private show(): void {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.visible()) return;
    this.shownAt = Date.now();
    this.visible.set(true);
  }

  private scheduleHide(): void {
    if (!this.visible()) return;
    const remaining = Math.max(0, MIN_DISPLAY_MS - (Date.now() - this.shownAt));
    this.hideTimeout = setTimeout(() => {
      this.hideTimeout = null;
      this.visible.set(false);
    }, remaining);
  }
}
