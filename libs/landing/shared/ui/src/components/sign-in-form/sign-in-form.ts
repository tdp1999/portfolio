import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { LandingCredentials, LandingSignInError } from '@portfolio/landing/shared/util';

import { LandingCopyPipe } from '../../pipes/landing-copy.pipe';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { Button } from '../button/button';
import { FormField } from '../form-field/form-field';
import { Input } from '../input/input';
import { SIGN_IN_ERROR_COPY } from './sign-in-form.data';

/**
 * `landing-sign-in-form` — email + password of the console account. Presentational: it emits the
 * credentials and shows the state it is given. `landing-auth-gate` wires it to the session.
 */
@Component({
  selector: 'landing-sign-in-form',
  imports: [ReactiveFormsModule, LandingCopyPipe, Button, FormField, Input],
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInForm {
  protected readonly locale = inject(LandingLocaleService).locale;

  readonly submitting = input(false);
  readonly error = input<LandingSignInError | null>(null);

  readonly submitted = output<LandingCredentials>();

  protected readonly errorKey = computed(() => {
    const error = this.error();
    return error ? SIGN_IN_ERROR_COPY[error] : null;
  });

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }
}
