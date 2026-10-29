import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { ErrorMessage } from '@portfolio/console/shared/util';
import { textLength } from '@portfolio/shared/validation';

// The API trims and NFC-normalizes text before it checks the length, so the form counts the same way.

/** `required` when the text is empty after trimming. */
export function requiredText(): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null =>
    textLength(control.value ?? '') === 0 ? { required: true } : null;
}

/** `maxlength` when the trimmed text is longer than `max`. */
export function maxText(max: number): ValidatorFn {
  return (control: AbstractControl<string | null>): ValidationErrors | null => {
    const actualLength = textLength(control.value ?? '');
    return actualLength > max ? { maxlength: { requiredLength: max, actualLength } } : null;
  };
}

/** Messages of the `formError` pipe for a field called `label`. */
export const fieldMessages = (label: string): Record<string, ErrorMessage> => ({
  required: `${label} is required`,
  maxlength: (p) => `Maximum ${p['requiredLength']} characters`,
});
