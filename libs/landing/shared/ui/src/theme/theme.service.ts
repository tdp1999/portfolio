import { DOCUMENT, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { LandingTheme } from './theme.types';
import { COOKIE_KEY, COOKIE_MAX_AGE_S, STORAGE_KEY } from './theme.data';
import { readInitialTheme } from './theme.util';

@Injectable({ providedIn: 'root' })
export class LandingThemeService {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ── Writable ──────────────────────────────────────────────────────
  readonly theme = signal<LandingTheme>(this.getInitialTheme());

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

  private getInitialTheme(): LandingTheme {
    return readInitialTheme(this.document, this.isBrowser);
  }
}
