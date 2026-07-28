import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, PLATFORM_ID, computed, effect, inject, untracked, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import {
  LandingLocaleService,
  LandingScrollspyService,
  asLocale,
  resolveCopy,
  type InPageSection,
  type LandingCopyKey,
  LandingMetaService,
  SITE_URL,
} from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';
import { map } from 'rxjs';

const SEO_TAG = 'data-legal-seo';

export interface LegalPageConfig {
  readonly path: '/privacy' | '/terms';
  /** Copy **keys**, not strings — resolved per locale in the effect below. */
  readonly titleKey: LandingCopyKey;
  readonly descriptionKey: LandingCopyKey;
  /** Optional in-page-nav sections per locale (same anchor IDs, localized titles). */
  readonly sections?: Readonly<Record<Locale, readonly InPageSection[]>>;
}

export interface LegalPageState {
  readonly locale: Signal<Locale>;
  /** Section list for the active locale; empty when no `sections` configured. */
  readonly sections: Signal<readonly InPageSection[]>;
  /** Localized "On this page" label for the TOC. */
  readonly tocLabel: Signal<string>;
}

/**
 * Shared behaviour for `/privacy` and `/terms`: locale, TOC sections, document
 * title / meta, and the canonical + hreflang tags that let Google index the two
 * languages as alternates.
 *
 * **One locale, two representations.** These pages are the only ones that need a
 * distinct URL per language, because `hreflang` addresses URLs and a signal has
 * none. That used to mean they read `?lang=` and ignored the header toggle
 * entirely — which left a visible language switcher on screen that did nothing,
 * and made `?lang=` unreachable from the UI. So the URL is now a *reflection* of
 * the site locale rather than a second source of truth:
 *
 * - arriving with `?lang=vi` adopts Vietnamese site-wide (a shared link means
 *   "show me this in Vietnamese", and honouring it only halfway is the bug above);
 * - the header toggle moves the locale like everywhere else;
 * - an effect writes the locale back into `?lang=`, so canonical and hreflang
 *   always describe the URL the visitor is actually on.
 *
 * `en` is the absence of the parameter, matching `x-default`.
 */
export function useLegalPage(config: LegalPageConfig): LegalPageState {
  const document = inject(DOCUMENT);
  const seo = inject(LandingMetaService);
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const localeService = inject(LandingLocaleService);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const destroyRef = inject(DestroyRef);
  // Optional: pages that render a TOC provide LandingScrollspyService themselves.
  const scrollspy = inject(LandingScrollspyService, { optional: true });

  // Adopted synchronously, not in an effect, because SSR has to render the right
  // language on the FIRST pass — this is what makes `/privacy?lang=vi` server-render
  // Vietnamese for a crawler that carries no cookie.
  const initialFromUrl = asLocale(route.snapshot.queryParamMap.get('lang'));
  if (initialFromUrl) localeService.setLocale(initialFromUrl);

  /** The last `?lang=` value the state→URL effect wrote. See its guard for why. */
  let lastWritten: Locale | null = initialFromUrl;

  const locale = localeService.locale;

  const urlLocale = toSignal(route.queryParamMap.pipe(map((q) => asLocale(q.get('lang')))), {
    initialValue: initialFromUrl,
  });

  const sections = computed<readonly InPageSection[]>(() => config.sections?.[locale()] ?? []);
  const tocLabel = computed(() => resolveCopy('common.onThisPage', locale()));

  /**
   * URL → state. Covers a hand-edited address bar and any later navigation that
   * only changes the query string (Angular reuses the component, so the adoption
   * above does not re-run).
   *
   * `locale()` is read untracked on purpose: this effect must react to the URL
   * changing, never to the locale changing, or it would answer the effect below
   * and the two would trade writes.
   */
  effect(() => {
    const fromUrl = urlLocale();
    if (fromUrl && fromUrl !== untracked(locale)) localeService.setLocale(fromUrl);
  });

  /**
   * State → URL. Browser only: on the server the URL is already whatever the
   * request asked for, and there is nothing to rewrite.
   *
   * `replaceUrl` keeps a language flip out of session history, matching the
   * header toggle everywhere else on the site — otherwise Back would walk the
   * visitor through their own locale changes instead of leaving the page.
   */
  effect(() => {
    const lang = locale();
    if (!isBrowser) return;
    const wanted = lang === 'vi' ? 'vi' : null;
    // Guarded on what this effect last *wrote*, not on `route.snapshot`. The
    // snapshot does not update until a navigation activates, so on a fast double
    // toggle it still reads the pre-navigation value: the effect would conclude
    // the URL already matched, skip the write, and let the first navigation land
    // in the language the user had just left — which the URL→state effect would
    // then adopt back into the locale. Tracking our own writes also means the
    // second `navigate` cancels the first, so no intermediate value is ever
    // emitted for the other effect to react to.
    if (lastWritten === wanted) return;
    lastWritten = wanted;
    void router.navigate([], {
      relativeTo: route,
      queryParams: { lang: wanted },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  // The alternates belong to this page, and the head outlives it. Without this,
  // navigating away leaves every later page advertising `hreflang` alternates
  // that point at `/privacy`. Browser-only in effect — SSR builds a fresh head
  // per request — which is exactly why it is easy to miss.
  destroyRef.onDestroy(() => {
    document.head.querySelectorAll(`link[${SEO_TAG}]`).forEach((el) => el.remove());
  });

  effect(() => {
    const lang = locale();
    // `path` carries the query on purpose: these are the only two pages whose
    // canonical identity includes `?lang=`, and the service strips the query
    // everywhere else.
    seo.apply({
      title: resolveCopy(config.titleKey, lang),
      description: resolveCopy(config.descriptionKey, lang),
      path: config.path + (lang === 'vi' ? '?lang=vi' : ''),
    });
    setHreflangLinks(document, config.path);
  });

  // Keep scrollspy in sync with the active-locale section list (no-op when the
  // page didn't provide the service or configure sections).
  effect(() => scrollspy?.setSections(sections()));

  return { locale, sections, tocLabel };
}

/**
 * The `hreflang` alternates. `canonical` is deliberately absent — it belongs to
 * `LandingMetaService`, which owns one canonical link for the whole site; two
 * writers would mean two `<link rel="canonical">` in the same head.
 */
function setHreflangLinks(doc: Document, path: string): void {
  const head = doc.head;
  head.querySelectorAll(`link[${SEO_TAG}]`).forEach((el) => el.remove());

  const urlEn = `${SITE_URL}${path}`;
  const urlVi = `${SITE_URL}${path}?lang=vi`;

  appendLink(doc, head, { rel: 'alternate', hreflang: 'en', href: urlEn });
  appendLink(doc, head, { rel: 'alternate', hreflang: 'vi', href: urlVi });
  appendLink(doc, head, { rel: 'alternate', hreflang: 'x-default', href: urlEn });
}

interface LinkSpec {
  readonly rel: string;
  readonly href: string;
  readonly hreflang?: string;
}

function appendLink(doc: Document, head: HTMLElement, spec: LinkSpec): void {
  const el = doc.createElement('link');
  el.rel = spec.rel;
  el.href = spec.href;
  if (spec.hreflang) el.setAttribute('hreflang', spec.hreflang);
  el.setAttribute(SEO_TAG, '');
  head.appendChild(el);
}
