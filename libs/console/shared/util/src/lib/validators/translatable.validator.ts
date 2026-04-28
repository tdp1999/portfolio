import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Group-level validator for `TranslatableSchema` fields (en + vi both required).
 *
 * Apply on the parent `FormGroup` containing `en` and `vi` controls. Returns
 * `{ translatableEnViRequired: true }` on the group when either locale is empty/whitespace.
 *
 * Per-locale `Validators.required` on the leaf controls remains the recommended UX so each
 * `<mat-error>` lights up next to its field; this group validator exists for forms that
 * surface a single combined error for the bilingual pair.
 */
export function translatableRequiredValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const en = group.get('en');
    const vi = group.get('vi');
    if (!en || !vi) return null;
    const enEmpty = isBlank(en.value);
    const viEmpty = isBlank(vi.value);
    return enEmpty || viEmpty ? { translatableEnViRequired: true } : null;
  };
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}
