import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ErrorMessage, resolveValidationMessage } from './validation-messages';

/**
 * Resolves the first validation error message for a form control.
 *
 * Usage:
 * ```html
 * <mat-error>{{ form.controls.email | formError }}</mat-error>
 * ```
 *
 * With custom messages:
 * ```html
 * <mat-error>{{ form.controls.email | formError: { required: 'Email is required.' } }}</mat-error>
 * ```
 *
 * For group-level errors (e.g., passwordsMismatch on the FormGroup):
 * ```html
 * <mat-error>{{ form.controls.confirmPassword | formError: { passwordsMismatch: 'Passwords do not match.' } : form }}</mat-error>
 * ```
 */
@Pipe({
  name: 'formError',
  standalone: true,
  pure: false,
})
export class FormErrorPipe implements PipeTransform {
  transform(
    control: AbstractControl | null,
    customMessages?: Record<string, ErrorMessage>,
    parentGroup?: FormGroup
  ): string {
    if (!control) return '';

    // Check control-level errors first
    if (control.errors) {
      const errorKey = Object.keys(control.errors)[0];
      return resolveValidationMessage(errorKey, control.errors[errorKey], customMessages);
    }

    // Check parent group errors (e.g., passwordsMismatch cross-field validator)
    if (parentGroup?.errors) {
      for (const errorKey of Object.keys(parentGroup.errors)) {
        const customMsg = customMessages?.[errorKey];
        if (customMsg) {
          return resolveValidationMessage(errorKey, parentGroup.errors[errorKey], customMessages);
        }
      }
    }

    return '';
  }
}
