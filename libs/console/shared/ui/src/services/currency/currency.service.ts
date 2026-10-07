import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { STORAGE_KEYS } from '@portfolio/console/shared/util';
import type { CurrencyPreference } from './currency.types';
import { MAX_VND_PER_USD, MIN_VND_PER_USD, parseCurrencyPreference } from './currency.util';

/** Free, keyless daily rates (ExchangeRate-API open access). Allowed in the console CSP `connect-src`. */
const RATE_URL = 'https://open.er-api.com/v6/latest/USD';

/**
 * The display currency and USD→VND rate, kept in this browser (like the theme). Amounts stay in
 * micro-USD everywhere else; `<console-money>` converts them on render.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly state = signal<CurrencyPreference>(this.load());

  readonly preference = this.state.asReadonly();

  save(preference: CurrencyPreference): void {
    this.state.set(preference);
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEYS.consoleCurrency, JSON.stringify(preference));
    } catch {
      // Storage blocked (private window): the choice still holds for this session.
    }
  }

  /** Today's USD→VND rate from the public feed. Rejects when the feed is down or answers nonsense. */
  async fetchVndPerUsd(): Promise<number> {
    const res = await fetch(RATE_URL);
    if (!res.ok) throw new Error(`Rate feed answered ${res.status}`);
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const rate = body.rates?.['VND'];
    if (body.result !== 'success' || !rate || rate < MIN_VND_PER_USD || rate > MAX_VND_PER_USD) {
      throw new Error('Rate feed gave no usable VND rate');
    }
    return Math.round(rate);
  }

  private load(): CurrencyPreference {
    if (!this.isBrowser) return parseCurrencyPreference(null);
    try {
      return parseCurrencyPreference(localStorage.getItem(STORAGE_KEYS.consoleCurrency));
    } catch {
      return parseCurrencyPreference(null);
    }
  }
}
