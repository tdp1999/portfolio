import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContainerComponent } from '../components/container';
import { LandingSocialRowComponent } from '../components/social-row';
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
  imports: [ContainerComponent, LandingSocialRowComponent],
  template: `
    <footer class="border-t border-landing-border" role="contentinfo">
      <landing-container size="wide">
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-8">
          <p class="m-0 font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500">
            © {{ year }} {{ fullName() || 'Portfolio' }}. All rights reserved.
          </p>
          <landing-social-row [socialLinks]="socialLinks()" [iconSize]="18" />
        </div>
      </landing-container>
    </footer>
  `,
})
export class LandingFooterSignatureComponent {
  readonly fullName = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);

  protected readonly year = new Date().getFullYear();
}
