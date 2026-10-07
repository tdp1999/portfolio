/** The currency money is shown in. Every amount is stored and priced in USD; this is display only. */
export type DisplayCurrency = 'VND' | 'USD';

export interface CurrencyPreference {
  currency: DisplayCurrency;
  /** How many dong one US dollar buys. Entered by hand or fetched once; it does not need to be live. */
  vndPerUsd: number;
  /** When `vndPerUsd` was last set, ISO string; null for the built-in default. */
  rateUpdatedAt: string | null;
}

/** One amount ready to render: the text in the display currency and the USD original for the tooltip. */
export interface MoneyView {
  text: string;
  tooltip: string;
}
