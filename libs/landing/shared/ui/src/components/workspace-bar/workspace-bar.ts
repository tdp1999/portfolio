import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HydrationSafeActiveDirective } from '../../directives/hydration-safe-active/hydration-safe-active.directive';
import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { workspacePages } from '../header/header.data';
import { Icon } from '../icon/icon';

/**
 * `landing-workspace-bar` — the secondary header of the private pages, placed by their frame right
 * under the site header while the Owner is signed in. Left: the Workspace eyebrow and a tab per
 * private page (the same list as the header's Workspace menu). Right: who is signed in and sign-out.
 * Public pages never show it. Takes the width of its container, so the caller decides the frame.
 * Below tablet the owner badge and sign-out keep only their dot and icon.
 */
@Component({
  selector: 'landing-workspace-bar',
  imports: [RouterLink, HydrationSafeActiveDirective, Icon],
  templateUrl: './workspace-bar.html',
  styleUrl: './workspace-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class WorkspaceBar {
  private readonly locale = inject(LandingLocaleService).locale;

  readonly signOut = output<void>();

  protected readonly pages = computed(() => workspacePages(this.locale()));
  protected readonly workspaceLabel = computed(() => resolveCopy('nav.workspace', this.locale()));
  protected readonly navLabel = computed(() => resolveCopy('auth.workspace.nav', this.locale()));
  protected readonly ownerLabel = computed(() => resolveCopy('auth.session.owner', this.locale()));
  protected readonly signedInLabel = computed(() => resolveCopy('auth.session.signedIn', this.locale()));
  protected readonly signOutLabel = computed(() => resolveCopy('auth.signOut', this.locale()));
}
