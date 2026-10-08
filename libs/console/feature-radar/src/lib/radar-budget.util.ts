import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { amountToUsd, CurrencyPreference, microUsdToAmount, toMoneyView } from '@portfolio/console/shared/ui';
import { ErrorMessage } from '@portfolio/console/shared/util';
import { MAX_RUN_BUDGET_USD, MIN_RUN_BUDGET_USD } from './radar.constants';

/**
 * The AI budget field of the New run and Re-analyze dialogs: typed in the display currency
 * (Settings, Currency), checked against the server's per-run range there, sent in USD.
 */

export const BUDGET_MESSAGES: Record<string, ErrorMessage> = {
  budgetRange: (p) => `Between ${p['min']} and ${p['max']}.`,
};

/** The server takes $0.01 to $100 per run: checked in the display currency, the range quoted in it. */
export function budgetRangeValidator(preference: () => CurrencyPreference): ValidatorFn {
  return (c: AbstractControl<number | null>): ValidationErrors | null => {
    if (c.value === null) return null;
    const pref = preference();
    const usd = amountToUsd(c.value, pref);
    if (usd >= MIN_RUN_BUDGET_USD && usd <= MAX_RUN_BUDGET_USD) return null;
    return {
      budgetRange: {
        min: toMoneyView(MIN_RUN_BUDGET_USD * 1_000_000, pref).text,
        max: toMoneyView(MAX_RUN_BUDGET_USD * 1_000_000, pref).text,
      },
    };
  };
}

/** The server's default budget as the field shows it: whole dong, or cents in USD. */
export function budgetFieldValue(microUsd: number, pref: CurrencyPreference): number {
  const amount = microUsdToAmount(microUsd, pref);
  return pref.currency === 'VND' ? Math.round(amount) : Number(amount.toFixed(2));
}

/** The typed budget in USD (cents kept), or undefined to let the server apply its default. */
export function budgetToUsd(budget: number | null, pref: CurrencyPreference): number | undefined {
  if (budget === null || budget <= 0) return undefined;
  // The validator keeps the amount in range, and rounding to cents cannot push it out.
  return Math.round(amountToUsd(budget, pref) * 100) / 100;
}
