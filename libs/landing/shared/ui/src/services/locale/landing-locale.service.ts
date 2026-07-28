import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, REQUEST, effect, inject, signal } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import { STORAGE_KEY, COOKIE_KEY, COOKIE_MAX_AGE_S } from './landing-locale.constants';
import { asLocale, localeFromAcceptLanguage, localeFromCookieHeader } from './landing-locale.util';

/**
 * Root-provided locale state for the landing app.
 *
 * The `locale` signal is the single source of truth for which language to render.
 * Components / services that have localized content read `locale()` inside computeds
 * — when the user changes language, those automatically recompute.
 *
 * Persists via localStorage + cookie so the choice survives reload, and the server
 * reads that cookie back off the request so the FIRST paint is already in the right
 * language. See {@link readInitial} for the resolution order on each platform.
 */
@Injectable({ providedIn: 'root' })
export class LandingLocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  /**
   * The incoming request, server-side only. `null` in the browser and — this part
   * matters — `null` during prerender, since there is no request at build time.
   * Prerendered routes therefore keep falling back to `en`; see `readInitial`.
   */
  private readonly request = inject(REQUEST, { optional: true });

  private readonly localeSignal = signal<Locale>(this.readInitial());
  readonly locale = this.localeSignal.asReadonly();

  constructor() {
    // Persist + reflect on root element so SSR/CSR can pick it up.
    effect(() => {
      const loc = this.localeSignal();
      this.document.documentElement.setAttribute('lang', loc);
      if (!this.isBrowser) return;
      try {
        localStorage.setItem(STORAGE_KEY, loc);
      } catch {
        // private mode — non-fatal
      }
      this.document.cookie = `${COOKIE_KEY}=${loc}; Max-Age=${COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax`;
    });
  }

  setLocale(locale: Locale): void {
    this.localeSignal.set(locale);
  }

  toggle(): void {
    this.localeSignal.update((l) => (l === 'en' ? 'vi' : 'en'));
  }

  /**
   * The locale to render before any user interaction.
   *
   * Both platforms answer the same two questions in the same order — "did this
   * visitor already choose?" then "what does their client prefer?" — using
   * whichever transport that platform has:
   *
   * | | chose already | client preference |
   * |---|---|---|
   * | browser | `localStorage` | `navigator.languages` |
   * | server  | `Cookie` header | `Accept-Language` header |
   *
   * Keeping the server in step with the browser is the whole point: without it a
   * returning Vietnamese visitor gets an English first paint that flips once
   * hydration runs the browser branch, and a crawler only ever sees English.
   *
   * Two cases legitimately still resolve to `en`:
   * - **prerendered routes**, where there is no request to read: their HTML is
   *   baked at build time, so the flip on hydration is unavoidable without
   *   per-locale prerendering. `/ddl` is the only one left, and it is English by
   *   nature — every localized route renders `Server` for exactly this reason
   *   (see `app.routes.server.ts`);
   * - a first-time visitor whose client asks for neither language.
   */
  private readInitial(): Locale {
    if (!this.isBrowser) {
      const headers = this.request?.headers;
      return (
        localeFromCookieHeader(headers?.get('cookie')) ??
        localeFromAcceptLanguage(headers?.get('accept-language')) ??
        // Prerender has no request at all. The `lang` attribute is the last
        // resort: index.html ships `lang="en"`, so this is the `en` default
        // expressed as a lookup rather than a literal.
        asLocale(this.document.documentElement.getAttribute('lang')) ??
        'en'
      );
    }
    try {
      const stored = asLocale(localStorage.getItem(STORAGE_KEY));
      if (stored) return stored;
    } catch {
      // private mode — fall through to the client preference
    }
    // `navigator.languages` is already q-sorted by the browser, so a plain scan
    // is the client-side equivalent of `localeFromAcceptLanguage`.
    if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
      for (const lang of navigator.languages) {
        const tag = lang.toLowerCase();
        if (tag.startsWith('vi')) return 'vi';
        if (tag.startsWith('en')) return 'en';
      }
    }
    return 'en';
  }
}
