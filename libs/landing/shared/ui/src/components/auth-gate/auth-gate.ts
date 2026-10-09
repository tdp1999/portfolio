import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';

import type { LandingAuthStatus, LandingCredentials, LandingSignInError } from '@portfolio/landing/shared/util';

import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import { SignInForm } from '../sign-in-form/sign-in-form';

/**
 * `landing-auth-gate` — wraps a private page. Shows a spinner while the session is checked, the
 * sign-in form while signed out, and the projected content only once signed in, so nothing private
 * is even created before then. The content goes in an `<ng-template>`: plain projected content would
 * be instantiated while signed out, and a private page would start calling its API. Bind it to `LandingAuthService` from `@portfolio/landing/shared/data-access`:
 *
 * ```html
 * <landing-auth-gate
 *   [status]="auth.status()"
 *   [submitting]="auth.isSubmitting()"
 *   [error]="auth.signInError()"
 *   (signIn)="auth.signIn($event)"
 * >
 *   <ng-template><router-outlet /></ng-template>
 * </landing-auth-gate>
 * ```
 */
@Component({
  selector: 'landing-auth-gate',
  imports: [NgTemplateOutlet, LoadingSpinner, SignInForm],
  templateUrl: './auth-gate.html',
  styleUrl: './auth-gate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthGate {
  private readonly locale = inject(LandingLocaleService).locale;

  readonly status = input.required<LandingAuthStatus>();
  readonly submitting = input(false);
  readonly error = input<LandingSignInError | null>(null);

  readonly signIn = output<LandingCredentials>();

  protected readonly content = contentChild(TemplateRef);

  protected readonly checkingLabel = computed(() => resolveCopy('auth.gate.checking', this.locale()));
}
