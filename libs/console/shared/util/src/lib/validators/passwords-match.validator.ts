import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Cross-field validator: the confirm control must equal the password control.
 *
 * The error lands in **two** places on purpose:
 *
 * - on the group, because that is what makes the group invalid and blocks submit;
 * - mirrored onto the confirm control, because that is the only way the message can be
 *   *seen*. `<mat-form-field>` renders its projected `<mat-error>` only when
 *   `_control.errorState` is true (`_getSubscriptMessageType()`), and `errorState` is
 *   computed by an `ErrorStateMatcher` that is handed the **control**, never the group.
 *   A group-only error therefore blocks the submit button while showing nothing at all,
 *   which reads to the user as a dead form.
 */
export function passwordsMatchValidator(passwordKey = 'password', confirmKey = 'confirmPassword'): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey);
    const confirm = group.get(confirmKey);
    if (!password || !confirm) return null;

    const mismatch = password.value !== confirm.value;
    mirrorOntoConfirm(confirm, mismatch);
    return mismatch ? { passwordsMismatch: true } : null;
  };
}

/**
 * Add or drop `passwordsMismatch` on the confirm control without disturbing its own errors
 * (`required`, `minlength`, …).
 *
 * `setErrors` only recalculates status and walks up the tree — it does not re-run
 * validators — so calling it from inside a group validator cannot recurse. `emitEvent: false`
 * keeps this out of the form's `statusChanges` stream; Material still picks the change up,
 * because `MatInput` refreshes `errorState` in `ngDoCheck` rather than from an event.
 */
function mirrorOntoConfirm(confirm: AbstractControl, mismatch: boolean): void {
  const alreadyCorrect = !!confirm.errors?.['passwordsMismatch'] === mismatch;
  if (alreadyCorrect) return;

  const { passwordsMismatch: _dropped, ...others } = confirm.errors ?? {};
  const next = mismatch ? { ...others, passwordsMismatch: true } : others;

  confirm.setErrors(Object.keys(next).length > 0 ? next : null, { emitEvent: false });
}
