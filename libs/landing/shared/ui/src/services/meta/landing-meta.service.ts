import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LandingLocaleService } from '../locale';
import { CANONICAL_TAG, OG_IMAGE, OG_LOCALE, SITE_URL, defaultDescription, defaultTitle } from './landing-meta.data';
import { stripQuery } from './landing-meta.util';
import type { LandingPageMeta } from './landing-meta.types';

/**
 * The single writer for the document head.
 *
 * Pages used to call `Title.setTitle` and four `Meta.updateTag`s each, which is
 * how the head ended up half-frozen at whatever `index.html` shipped: every page
 * remembered `og:title` and `og:description`, none of them remembered
 * `twitter:*`, and `og:url` pointed at the homepage no matter what you shared.
 * A page now declares {@link LandingPageMeta} once and this service derives the
 * eleven tags that follow from it.
 *
 * Locale is read here rather than passed in, so `og:locale` and the description
 * fallback stay correct without every caller repeating them. Pages call `apply`
 * from inside an `effect` that already tracks locale, so a language switch
 * rewrites the head the same way it rewrites the page.
 */
@Injectable({ providedIn: 'root' })
export class LandingMetaService {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly locale = inject(LandingLocaleService).locale;

  private started = false;
  /** Property names written by the previous `apply`, so they can be cleared. */
  private extraApplied: readonly string[] = [];

  /**
   * Install the site-wide defaults. Idempotent — safe to call from multiple
   * bootstrap sites.
   *
   * Applied once immediately *and* on every {@link NavigationStart}: the server
   * renders exactly one route and never fires a navigation event for it, while
   * in the browser the reset is what stops a page that declares nothing from
   * inheriting the previous page's head.
   *
   * A page's own `apply` always wins — its constructor and effects run after
   * both of these.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.applyDefaults();
    this.router.events.pipe(filter((e): e is NavigationStart => e instanceof NavigationStart)).subscribe((e) => {
      // **Only when the page actually changes.** A fragment-only navigation is
      // still a navigation — every in-page TOC link is `[routerLink]="[]"` with a
      // `[fragment]`, and the legal pages rewrite their own query string — but no
      // new component is created, so no page effect re-runs to put the head back.
      // Resetting here would blank eleven tags and the canonical on a click that
      // never left the page. `router.url` is still the outgoing URL at this point.
      if (stripQuery(e.url) === stripQuery(this.router.url)) return;
      this.applyDefaults();
    });
  }

  /** Declare this page's head. Call from an `effect` so it tracks locale. */
  apply(page: LandingPageMeta): void {
    const locale = this.locale();
    const description = page.description || defaultDescription(locale);
    const image = page.image || OG_IMAGE;
    const url = SITE_URL + (page.path ?? stripQuery(this.router.url));

    this.title.setTitle(page.title);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: page.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: OG_LOCALE[locale] });
    this.meta.updateTag({
      property: 'og:locale:alternate',
      content: OG_LOCALE[locale === 'vi' ? 'en' : 'vi'],
    });

    this.meta.updateTag({ name: 'twitter:title', content: page.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.toggleTag(Boolean(page.imageAlt), { property: 'og:image:alt', content: page.imageAlt ?? '' });
    this.toggleTag(Boolean(page.noindex), { name: 'robots', content: 'noindex' });

    for (const property of this.extraApplied) this.meta.removeTag(`property='${property}'`);
    this.extraApplied = Object.keys(page.extra ?? {});
    for (const [property, content] of Object.entries(page.extra ?? {})) {
      this.meta.updateTag({ property, content });
    }

    this.setCanonical(url);
  }

  private applyDefaults(): void {
    const locale = this.locale();
    this.apply({ title: defaultTitle(locale), description: defaultDescription(locale) });
  }

  private toggleTag(on: boolean, definition: { name?: string; property?: string; content: string }): void {
    // Removing matters as much as writing: `noindex` set by /404 would otherwise
    // survive the next navigation and de-index a real page.
    if (on) this.meta.updateTag(definition);
    else this.meta.removeTag(definition.name ? `name='${definition.name}'` : `property='${definition.property}'`);
  }

  private setCanonical(href: string): void {
    const head = this.document.head;
    head.querySelectorAll(`link[${CANONICAL_TAG}]`).forEach((el) => el.remove());
    const link = this.document.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    link.setAttribute(CANONICAL_TAG, '');
    head.appendChild(link);
  }
}
