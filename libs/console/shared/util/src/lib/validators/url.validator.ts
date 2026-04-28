import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PATTERNS } from '@portfolio/shared/validation';

/**
 * Validates that a string control matches `PATTERNS.URL` (http/https + non-empty path).
 * Empty values are treated as valid — compose with `Validators.required` when required.
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return { urlInvalid: true };
    return PATTERNS.URL.test(value) ? null : { urlInvalid: true };
  };
}
