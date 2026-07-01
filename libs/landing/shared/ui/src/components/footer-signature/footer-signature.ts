import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Container } from '../container';
import { SocialRow } from '../social-row';
import { type SocialLink } from '@portfolio/shared/types';

/**
 * Site-wide footer signature — copyright on the left, social icons on the right.
 * Renders below every page (mounted by `landing-shell`). Pure presentational —
 * the host app injects `ProfileService` and forwards `fullName` / `socialLinks`.
 */
@Component({
  selector: 'landing-footer-signature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, SocialRow],
  template: `
    <footer class="border-t border-landing-border" role="contentinfo">
      <landing-container size="wide">
        <div
          class="flex flex-nowrap items-center justify-between gap-4 py-8 tablet:flex-wrap tablet:gap-x-6 tablet:gap-y-4"
        >
          <p class="m-0 min-w-0 truncate font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500">
            © {{ year }} {{ fullName() || 'Portfolio'
            }}<span class="hidden tablet:inline">. All rights reserved.</span>
          </p>
          <landing-social-row [socialLinks]="socialLinks()" [iconSize]="18" class="shrink-0" />
        </div>
      </landing-container>
    </footer>
  `,
})
export class FooterSignature {
  readonly fullName = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);

  protected readonly year = new Date().getFullYear();
}
