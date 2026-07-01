import { Directive, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';

/**
 * Drop-in replacement for Angular's `routerLinkActive` that doesn't flicker on SSR hydration.
 *
 * **Why:** `routerLinkActive` subscribes to `Router.events` in `ngOnInit` with `isActive=false`,
 * then waits for `NavigationEnd` to re-emit before re-applying its class. After SSR hydration
 * that creates a visible flash: SSR HTML has the active class → directive ngOnInit strips it →
 * router replays NavigationEnd → class re-added.
 *
 * This directive seeds a URL signal with `router.url` (set immediately at construction), so the
 * active state is correct on the very first change-detection tick after hydration. No flash.
 *
 * **Usage:**
 * ```html
 * <a [routerLink]="'/projects'" [hydrationSafeActive]="'/projects'">Projects</a>
 * <a [routerLink]="'/'" [hydrationSafeActive]="'/'" [hydrationSafeActiveExact]="true">Home</a>
 * ```
 *
 * The host element gets `nav-link--active` (or the class set via `hydrationSafeActiveClass`)
 * when the current URL matches.
 *
 * Use this for any landing-app nav link rendered during SSR. Console nav can stay on
 * `routerLinkActive` since it's CSR-only behind auth (no hydration).
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[hydrationSafeActive]',
  standalone: true,
  host: {
    '[class]': 'hostClass()',
  },
})
export class HydrationSafeActiveDirective {
  /** Path to compare against the current router URL. */
  readonly hydrationSafeActive = input.required<string>();
  /** Exact match (mirrors `routerLinkActiveOptions.exact`). Default false (prefix match). */
  readonly hydrationSafeActiveExact = input<boolean>(false);
  /** Class to apply when active. Default `nav-link--active`. */
  readonly hydrationSafeActiveClass = input<string>('nav-link--active');

  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  protected readonly hostClass = computed(() => {
    const current = this.url().split('?')[0].split('#')[0];
    const path = this.hydrationSafeActive();
    const matches = this.hydrationSafeActiveExact()
      ? current === path
      : current === path || current.startsWith(`${path}/`);
    return matches ? this.hydrationSafeActiveClass() : '';
  });
}
