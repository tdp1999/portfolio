import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validates that a numeric control holds an integer (no decimals). Covers `<input type="number">`
 * paste, comma/dot decimal entry, and string inputs typed manually. Empty values are valid.
 *
 * Use when BE schema is `z.number().int()`.
 */
export function integerValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;

    const num = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(num)) return { integerOnly: true };
    return Number.isInteger(num) ? null : { integerOnly: true };
  };
}
