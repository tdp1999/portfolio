import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';

import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
import { Icon } from '../icon/icon';

/**
 * `landing-session-bar` — slim row with sign-out, placed by a private page's frame right under the
 * site header, only while the Owner is signed in. Public pages never show it, and the header itself
 * stays the same for every visitor. Sign-in is the "Sign in" entry in the header's More menu. Takes
 * the width of its container, so the caller decides the frame.
 */
@Component({
  selector: 'landing-session-bar',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex h-10 items-center justify-end gap-4 border-b border-landing-border">
      <span class="font-sans text-body-sm text-landing-text-500">{{ signedInLabel() }}</span>
      <button
        type="button"
        class="inline-flex items-center gap-2 font-sans text-body-sm text-landing-text-400 transition-colors duration-motion-base ease-landing-ease hover:text-landing-text-300 focus-visible:text-landing-text-300"
        (click)="signOut.emit()"
        data-testid="session-sign-out"
      >
        <landing-icon name="log-out" [size]="16" />
        {{ signOutLabel() }}
      </button>
    </div>
  `,
})
export class SessionBar {
  private readonly locale = inject(LandingLocaleService).locale;

  readonly signOut = output<void>();

  protected readonly signedInLabel = computed(() => resolveCopy('auth.session.signedIn', this.locale()));
  protected readonly signOutLabel = computed(() => resolveCopy('auth.signOut', this.locale()));
}
