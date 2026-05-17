import { isPlatformBrowser } from '@angular/common';
import { Directive, inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Routes same-page fragment anchor clicks inside a markdown-rendered prose
 * container through Angular Router so the page stays an SPA navigation and the
 * configured `anchorScrolling` kicks in.
 *
 * The markdown renderer emits absolute hrefs (e.g. `/projects/console-mvp#overview`)
 * so the browser's hover preview shows the real destination. This directive
 * intercepts clicks whose pathname matches the current location and converts
 * them to a Router fragment nav; cross-page or external links pass through.
 *
 * Usage:
 *   <div class="landing-prose" landingProseAnchors [innerHTML]="html"></div>
 */
@Directive({
  selector: '[landingProseAnchors]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
  },
})
export class LandingProseAnchorsDirective {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  onClick(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Bail on modified clicks so users can still open links in new tabs.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest?.('a') as HTMLAnchorElement | null;
    if (!anchor) return;
    if (anchor.target && anchor.target !== '' && anchor.target !== '_self') return;

    const sameOrigin = anchor.origin === window.location.origin;
    const samePath = anchor.pathname === window.location.pathname;
    if (!sameOrigin || !samePath || !anchor.hash) return;

    event.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      fragment: anchor.hash.slice(1),
      queryParamsHandling: 'preserve',
      replaceUrl: false,
    });
  }
}
