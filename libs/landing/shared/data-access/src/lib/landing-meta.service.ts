import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from './landing-meta.data';

/**
 * Default page-level metadata. Applied on every {@link NavigationStart} so
 * pages that don't explicitly call `Title.setTitle` / `Meta.updateTag` start
 * from a known baseline instead of inheriting whatever the previously visited
 * page left behind.
 */

/**
 * Resets `<title>` and `<meta name="description">` to defaults on every
 * navigation start, so a page that doesn't set them won't keep the previous
 * page's values.
 *
 * Pages that *do* set metadata continue to do so in their constructor, which
 * runs after `NavigationStart` and before `NavigationEnd` — so their values
 * always win over the reset.
 *
 * SSR-safe: `Router` events fire only in the browser for client navigations.
 * The initial server render relies on the index.html `<title>` plus the
 * page's own constructor-time `setTitle` call.
 */
@Injectable({ providedIn: 'root' })
export class LandingMetaService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private started = false;

  /**
   * Subscribes to navigation events. Idempotent — safe to call from multiple
   * bootstrap sites.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe(() => {
      this.title.setTitle(DEFAULT_TITLE);
      this.meta.updateTag({ name: 'description', content: DEFAULT_DESCRIPTION });
    });
  }
}
