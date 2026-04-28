import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { PATTERNS } from '@portfolio/shared/validation';

/**
 * Validates that a password matches the BE `PASSWORD_REGEX` (≥8 chars, upper + lower +
 * digit + special). Empty values are treated as valid — compose with `Validators.required`.
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string') return { passwordWeak: true };
    return PATTERNS.PASSWORD.test(value) ? null : { passwordWeak: true };
  };
}
