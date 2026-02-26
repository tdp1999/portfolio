import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'console-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly theme = signal<Theme>(this.loadTheme());

  /** Resolved theme after applying system preference */
  readonly resolvedTheme = signal<'light' | 'dark'>(this.resolve(this.loadTheme()));

  constructor() {
    effect(() => {
      const theme = this.theme();
      const resolved = this.resolve(theme);
      this.resolvedTheme.set(resolved);

      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEY, theme);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      }
    });

    if (this.isBrowser) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.theme() === 'system') {
          this.resolvedTheme.set(this.resolve('system'));
          document.documentElement.classList.toggle('dark', this.resolvedTheme() === 'dark');
        }
      });
    }
  }

  toggle(): void {
    const current = this.resolvedTheme();
    this.theme.set(current === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private loadTheme(): Theme {
    if (!this.isBrowser) return 'system';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'system';
  }

  private resolve(theme: Theme): 'light' | 'dark' {
    if (theme !== 'system') return theme;
    if (!this.isBrowser) return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
