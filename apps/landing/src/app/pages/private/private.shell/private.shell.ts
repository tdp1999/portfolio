import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { LandingAuthService } from '@portfolio/landing/shared/data-access';
import {
  Container,
  LandingLocaleService,
  LandingMetaService,
  LoadingSpinner,
  resolveCopy,
  WorkspaceBar,
} from '@portfolio/landing/shared/ui';

import { SIGN_IN_PATH } from '../private.routes';

/**
 * Frame of every private page (`PRIVATE_ROUTES`). Signed in: the workspace bar right under the
 * header, then the routed page. Signed out: off to `/sign-in?next=<this url>`, which comes back here
 * once signed in. While the session is checked, a spinner; nothing private is created before then.
 * Sign-out lands on home first, so the redirect never fires for it and the header simply goes back
 * to "Sign in". The routed page sets its own title once signed in; until then the tab reads "Sign in".
 */
@Component({
  selector: 'landing-private-shell',
  imports: [RouterOutlet, Container, LoadingSpinner, WorkspaceBar],
  templateUrl: './private.shell.html',
  styleUrl: './private.shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PrivateShell {
  protected readonly auth = inject(LandingAuthService);
  private readonly router = inject(Router);
  private readonly seo = inject(LandingMetaService);
  private readonly locale = inject(LandingLocaleService).locale;

  protected readonly signedIn = computed(() => this.auth.status() === 'signed-in');
  protected readonly checkingLabel = computed(() => resolveCopy('auth.gate.checking', this.locale()));

  /** The shell outlives moves between private pages, and each move resets the head to defaults. */
  private readonly navigated = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
  );

  constructor() {
    effect(() => {
      this.navigated();
      if (this.auth.status() !== 'signed-in') {
        this.seo.apply({ title: resolveCopy('auth.signIn.title', this.locale()), noindex: true });
      }
    });
    effect(() => {
      if (this.auth.status() !== 'signed-out') return;
      void this.router.navigate([`/${SIGN_IN_PATH}`], {
        queryParams: { next: this.router.url },
        replaceUrl: true,
      });
    });
  }

  protected signOut(): void {
    void this.router.navigateByUrl('/').then(() => this.auth.signOut());
  }
}
