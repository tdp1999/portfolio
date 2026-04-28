/**
 * Scrolls to and focuses the first invalid form control on the page.
 * Call after `form.markAllAsTouched()` so `mat-error` elements have rendered.
 */
export function scrollToFirstError(root: ParentNode = document): void {
  const invalid = root.querySelector<HTMLElement>(
    '.mat-mdc-form-field.ng-invalid.mat-form-field-invalid, .ng-invalid[formControlName], .ng-invalid[formGroupName]'
  );
  if (!invalid) return;

  invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable = invalid.querySelector<HTMLElement>('input, textarea, select, [tabindex]');
  focusable?.focus({ preventScroll: true });
}
