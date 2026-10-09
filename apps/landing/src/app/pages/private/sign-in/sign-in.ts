import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';

import { LandingAuthService } from '@portfolio/landing/shared/data-access';
import {
  AuthGate,
  Container,
  LandingLocaleService,
  LandingMetaService,
  resolveCopy,
} from '@portfolio/landing/shared/ui';

import { signInReturnUrl } from './sign-in.util';

/**
 * `/sign-in`, opened from the "Sign in" entry in the header's More menu. Reuses the gate, so it shows
 * the spinner while the session is checked and the form while signed out. Once signed in (or when
 * already signed in) it returns to the page the Owner came from, or home on a direct load.
 */
@Component({
  selector: 'landing-sign-in',
  imports: [AuthGate, Container],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SignIn {
  protected readonly auth = inject(LandingAuthService);
  private readonly router = inject(Router);
  private readonly locale = inject(LandingLocaleService).locale;
  private readonly seo = inject(LandingMetaService);

  private readonly returnUrl = signInReturnUrl(
    this.router.currentNavigation()?.previousNavigation?.finalUrl?.toString()
  );

  constructor() {
    effect(() => this.seo.apply({ title: resolveCopy('auth.signIn.title', this.locale()), noindex: true }));
    effect(() => {
      if (this.auth.status() === 'signed-in') void this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
    });
  }
}
