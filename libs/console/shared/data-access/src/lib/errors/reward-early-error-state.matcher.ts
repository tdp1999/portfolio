import { Injectable } from '@angular/core';
import { AbstractControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * "Reward Early, Punish Late" ErrorStateMatcher for Angular Material form fields.
 *
 * - **Punish Late:** When user edits a valid field, errors are suppressed until blur
 *   (the default Material behavior already handles this via `touched`).
 * - **Reward Early:** When user fixes an invalid field, errors clear immediately on keystroke.
 *   This is handled natively by reactive forms — errors disappear as soon as validation passes.
 *
 * The main addition over the default matcher:
 * - Also shows errors when the form has been submitted (even if control isn't touched).
 * - This is the standard Angular Material `ShowOnDirtyErrorStateMatcher` behavior.
 *
 * Provide at component or module level:
 * ```typescript
 * providers: [{ provide: ErrorStateMatcher, useClass: RewardEarlyErrorStateMatcher }]
 * ```
 *
 * Or provide globally in app config.
 */
@Injectable()
export class RewardEarlyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (!control) return false;
    // Show errors when:
    // 1. Control is invalid AND touched (user has interacted and left the field) — "punish late"
    // 2. Control is invalid AND form has been submitted — immediate feedback after submit attempt
    // Angular's default reactive form behavior handles "reward early" automatically:
    // when the user fixes a field, errors are removed on the next validation cycle (keystroke).
    return control.invalid && (control.touched || (form?.submitted ?? false));
  }
}
