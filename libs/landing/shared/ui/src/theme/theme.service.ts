import { DOCUMENT, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LandingTheme } from './theme.types';

const STORAGE_KEY = 'landing_theme';
const COOKIE_KEY = 'landing_theme';
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 365;

@Injectable({ providedIn: 'root' })
export class LandingThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<LandingTheme>(this.readInitial());

  constructor() {
    effect(() => {
      const t = this.theme();
      const root = this.document.documentElement;
      root.setAttribute('data-theme', t);
      root.classList.toggle('dark', t === 'dark');
      if (this.isBrowser) {
        try {
          localStorage.setItem(STORAGE_KEY, t);
        } catch {
          // private mode / disabled storage — non-fatal
        }
        this.document.cookie = `${COOKIE_KEY}=${t}; Max-Age=${COOKIE_MAX_AGE_S}; Path=/; SameSite=Lax`;
      }
    });
  }

  setTheme(theme: LandingTheme): void {
    this.theme.set(theme);
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private readInitial(): LandingTheme {
    if (!this.isBrowser) return 'dark';
    const fromAttr = this.document.documentElement.getAttribute('data-theme');
    if (fromAttr === 'light' || fromAttr === 'dark') return fromAttr;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }
}
