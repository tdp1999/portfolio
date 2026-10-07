import type { CurrencyPreference } from './currency.types';
import {
  DEFAULT_CURRENCY_PREFERENCE,
  amountToUsd,
  formatUsd,
  parseCurrencyPreference,
  toMoneyView,
} from './currency.util';

const vnd: CurrencyPreference = { currency: 'VND', vndPerUsd: 26_000, rateUpdatedAt: null };
const usd: CurrencyPreference = { ...vnd, currency: 'USD' };
/** Intl puts a no-break space before ₫. */
const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatUsd', () => {
  it.each([
    [0, '$0'],
    [18, '$0.000018'],
    [12_345, '$0.0123'],
    [1_234_567, '$1.23'],
  ])('formats %s micro-USD as %s', (micro, text) => {
    expect(formatUsd(micro)).toBe(text);
  });
});

describe('toMoneyView', () => {
  it.each([
    [1_000_000, '26.000 ₫'],
    [2_400, '62 ₫'],
    [18, '0,47 ₫'],
  ])('shows %s micro-USD as %s, with the USD original and the rate in the tooltip', (micro, text) => {
    const view = toMoneyView(micro, vnd);

    expect(plain(view.text)).toBe(text);
    expect(view.tooltip).toBe(`${formatUsd(micro)} USD\n1 USD = 26.000 ₫`);
  });

  it('should keep dollars and still name USD in the tooltip when the display currency is USD', () => {
    expect(toMoneyView(12_345, usd)).toEqual({ text: '$0.0123', tooltip: '$0.0123 USD' });
  });

  it('should say "No price" for an amount the API could not price', () => {
    expect(toMoneyView(null, vnd).text).toBe('No price');
  });
});

describe('amountToUsd', () => {
  it('should turn dong back into dollars and leave dollars alone', () => {
    expect(amountToUsd(13_000, vnd)).toBe(0.5);
    expect(amountToUsd(0.5, usd)).toBe(0.5);
  });
});

describe('parseCurrencyPreference', () => {
  it.each([
    ['missing', null],
    ['not JSON', '{oops'],
  ])('should fall back to the default when the stored value is %s', (_label, raw) => {
    expect(parseCurrencyPreference(raw)).toEqual(DEFAULT_CURRENCY_PREFERENCE);
  });

  it('should keep a valid choice and reset an out-of-range rate with its date', () => {
    const stored = JSON.stringify({ currency: 'USD', vndPerUsd: 26, rateUpdatedAt: '2026-10-07T00:00:00Z' });

    expect(parseCurrencyPreference(stored)).toEqual({ currency: 'USD', vndPerUsd: 26_000, rateUpdatedAt: null });
  });
});
