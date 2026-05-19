import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';

const STORAGE_KEY = 'landing_locale';
const COOKIE_KEY = 'landing_locale';
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 365;

/**
 * Root-provided locale state for the landing app.
 *
 * The `locale` signal is the single source of truth for which language to render.
 * Components / services that have localized content read `locale()` inside computeds
 * — when the user changes language, those automatically recompute.
 *
 * Persists via localStorage + cookie so the choice survives reload and is visible
 * to the SSR server (cookie) for future first-paint language matching.
 */
@Injectable({ providedIn: 'root' })
export class LandingLocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _locale = signal<Locale>(this.readInitial());
  readonly locale = this._locale.asReadonly();

  constructor() {
    // Persist + reflect on root element so SSR/CSR can pick it up.
    effect(() => {
      const loc = this._locale();
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
    this._locale.set(locale);
  }

  toggle(): void {
    this._locale.update((l) => (l === 'en' ? 'vi' : 'en'));
  }

  private readInitial(): Locale {
    if (!this.isBrowser) {
      // SSR: try to read from the document's lang attribute (server may have set it).
      const fromAttr = this.document.documentElement.getAttribute('lang');
      if (fromAttr === 'en' || fromAttr === 'vi') return fromAttr;
      return 'en';
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'vi') return stored;
    } catch {
      // ignore
    }
    // Fall back to the browser's preferred languages.
    if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
      for (const lang of navigator.languages) {
        if (lang.toLowerCase().startsWith('vi')) return 'vi';
        if (lang.toLowerCase().startsWith('en')) return 'en';
      }
    }
    return 'en';
  }
}
