import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { LandingAuthService } from '@portfolio/landing/shared/data-access';
import {
  AuthGate,
  Container,
  LandingLocaleService,
  LandingMetaService,
  resolveCopy,
  SessionBar,
} from '@portfolio/landing/shared/ui';

/**
 * Frame of every private page (`PRIVATE_ROUTES`): the sign-in gate around the routed page, and once
 * signed in the session bar (sign-out) right under the header. Public pages never show the bar. The
 * session is app-wide, so signing in here once opens every private page. The routed page sets its
 * own title once signed in; until then the tab reads "Sign in".
 */
@Component({
  selector: 'landing-private-shell',
  imports: [RouterOutlet, AuthGate, Container, SessionBar],
  templateUrl: './private.shell.html',
  styleUrl: './private.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrivateShell {
  protected readonly auth = inject(LandingAuthService);
  private readonly seo = inject(LandingMetaService);
  private readonly locale = inject(LandingLocaleService).locale;

  protected readonly signedIn = computed(() => this.auth.status() === 'signed-in');

  /** The shell outlives moves between private pages, and each move resets the head to defaults. */
  private readonly navigated = toSignal(
    inject(Router).events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
  );

  constructor() {
    effect(() => {
      this.navigated();
      if (this.auth.status() !== 'signed-in') {
        this.seo.apply({ title: resolveCopy('auth.signIn.title', this.locale()), noindex: true });
      }
    });
  }
}
