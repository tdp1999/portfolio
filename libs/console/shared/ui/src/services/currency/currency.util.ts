import type { CurrencyPreference, MoneyView } from './currency.types';

export const DEFAULT_VND_PER_USD = 26_000;
/** The rate input refuses values outside this, so a typo (26 or 26_000_000) cannot slip through. */
export const MIN_VND_PER_USD = 1_000;
export const MAX_VND_PER_USD = 100_000;

export const DEFAULT_CURRENCY_PREFERENCE: CurrencyPreference = {
  currency: 'VND',
  vndPerUsd: DEFAULT_VND_PER_USD,
  rateUpdatedAt: null,
};

const VND_WHOLE = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
/** Below 1 dong, two significant digits keep tiny AI call costs apart (0,47 ₫ vs 0,05 ₫). */
const VND_TINY = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumSignificantDigits: 2 });
const RATE = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** Micro-USD as dollars, precise enough to tell tiny costs apart: 18 → "$0.000018", 1_234_567 → "$1.23". */
export function formatUsd(microUsd: number): string {
  if (microUsd === 0) return '$0';
  const usd = microUsd / 1_000_000;
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${Number(usd.toPrecision(2))}`;
}

export function formatVnd(vnd: number): string {
  return vnd === 0 || vnd >= 1 ? VND_WHOLE.format(vnd) : VND_TINY.format(vnd);
}

/** A micro-USD amount in the display currency, with the USD original (and the rate used) for the tooltip. */
export function toMoneyView(microUsd: number | null, pref: CurrencyPreference): MoneyView {
  if (microUsd === null) return { text: 'No price', tooltip: 'This model has no price in the API price table' };
  const usd = `${formatUsd(microUsd)} USD`;
  if (pref.currency === 'USD') return { text: formatUsd(microUsd), tooltip: usd };
  return {
    text: formatVnd(microUsdToAmount(microUsd, pref)),
    tooltip: `${usd}\n1 USD = ${RATE.format(pref.vndPerUsd)} ₫`,
  };
}

/** A micro-USD amount in the display currency's units (dollars or dong). */
export function microUsdToAmount(microUsd: number, pref: CurrencyPreference): number {
  const usd = microUsd / 1_000_000;
  return pref.currency === 'VND' ? usd * pref.vndPerUsd : usd;
}

/** An amount typed in the display currency, back to US dollars (what the API takes). */
export function amountToUsd(amount: number, pref: CurrencyPreference): number {
  return pref.currency === 'VND' ? amount / pref.vndPerUsd : amount;
}

/** A stored preference, or the default when it is missing, malformed or out of range. */
export function parseCurrencyPreference(raw: string | null): CurrencyPreference {
  if (!raw) return DEFAULT_CURRENCY_PREFERENCE;
  try {
    const v = JSON.parse(raw) as Partial<CurrencyPreference>;
    const currency = v.currency === 'USD' || v.currency === 'VND' ? v.currency : DEFAULT_CURRENCY_PREFERENCE.currency;
    const rate = Number(v.vndPerUsd);
    const validRate = Number.isFinite(rate) && rate >= MIN_VND_PER_USD && rate <= MAX_VND_PER_USD;
    return {
      currency,
      vndPerUsd: validRate ? rate : DEFAULT_VND_PER_USD,
      rateUpdatedAt: validRate && typeof v.rateUpdatedAt === 'string' ? v.rateUpdatedAt : null,
    };
  } catch {
    return DEFAULT_CURRENCY_PREFERENCE;
  }
}
