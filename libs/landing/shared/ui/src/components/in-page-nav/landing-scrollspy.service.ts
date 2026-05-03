import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { InPageSection } from './section.types';

/**
 * Tracks which section in a page is currently active based on scroll position.
 *
 * Provide at the page/component level (NOT root) so each long-form page has its own instance.
 * Call `setSections(...)` once with the page's section list, then read `active()` from anywhere.
 */
@Injectable()
export class LandingScrollspyService {
  private readonly _active = signal<string>('');
  private _sections: readonly InPageSection[] = [];

  readonly active = this._active.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    const handler = () => this.update();
    window.addEventListener('scroll', handler, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', handler));
  }

  setSections(sections: readonly InPageSection[]): void {
    this._sections = sections;
    if (this._active() === '' && sections.length > 0) {
      this._active.set(sections[0].id);
    }
    this.update();
  }

  private update(): void {
    if (typeof document === 'undefined' || this._sections.length === 0) return;
    const offset = window.innerHeight * 0.35;
    let current = this._sections[0].id;
    for (const s of this._sections) {
      const el = document.getElementById(s.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top - offset <= 0) current = s.id;
    }
    if (current !== this._active()) this._active.set(current);
  }
}
