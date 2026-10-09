import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { LandingAuthService } from '@portfolio/landing/shared/data-access';
import {
  type BreadcrumbItem,
  Container,
  LandingLocaleService,
  LandingMetaService,
  LoadingSpinner,
  PageShell,
  resolveCopy,
  SignInForm,
} from '@portfolio/landing/shared/ui';

import { signInReturnUrl } from './sign-in.util';

/**
 * `/sign-in`, opened from the header's "Sign in" item, or sent here by a private page with
 * `?next=<its url>`. A feature page like `/contact`: breadcrumb and title, the form centred below.
 * Shows a spinner while the session is checked. Once signed in (or when already signed in) it
 * returns to `next`, else the page the Owner came from, else home.
 */
@Component({
  selector: 'landing-sign-in',
  imports: [Container, LoadingSpinner, PageShell, SignInForm],
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
    inject(ActivatedRoute).snapshot.queryParamMap.get('next'),
    this.router.currentNavigation()?.previousNavigation?.finalUrl?.toString()
  );

  protected readonly title = computed(() => resolveCopy('auth.signIn.title', this.locale()));
  protected readonly checkingLabel = computed(() => resolveCopy('auth.gate.checking', this.locale()));
  protected readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => [
    { label: resolveCopy('common.page.home', this.locale()), href: '/' },
    { label: this.title() },
  ]);

  constructor() {
    effect(() => this.seo.apply({ title: this.title(), noindex: true }));
    effect(() => {
      if (this.auth.status() === 'signed-in') void this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
    });
  }
}
