import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Mirror in-page state to the URL **without** triggering a router navigation.
 *
 * Why this exists: the landing app uses
 * `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })` so that
 * route changes restore the user's scroll. The side effect is that any
 * `router.navigate(..., { queryParamsHandling: 'merge' })` — including
 * filter / sort / view-toggle / pagination updates that stay on the same
 * page — counts as a navigation and jumps the viewport to the top.
 *
 * Use this service for **URL-as-state-mirror** scenarios: toolbars (filter
 * chips, sort segmented, view toggle, search debounce), pagination, tab
 * keys on DDL pages.
 *
 * Reserve `Router.navigate` for **actual** route changes (going to a new
 * page) where scroll restoration is the desired behavior.
 *
 * Consumer contract: hold UI state in local signals. `Location.replaceState`
 * does not update `ActivatedRoute.queryParamMap`, so reading from the route
 * after a patch yields stale values.
 */
@Injectable({ providedIn: 'root' })
export class LandingUrlStateService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  /**
   * Merge query params into the current URL via `Location.replaceState`.
   * Pass `null` to remove a key.
   */
  patchQueryParams(route: ActivatedRoute, params: Record<string, string | readonly string[] | null | undefined>): void {
    const tree = this.router.createUrlTree([], {
      relativeTo: route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
    this.location.replaceState(this.router.serializeUrl(tree));
  }
}
