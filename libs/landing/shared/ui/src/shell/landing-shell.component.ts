import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LandingHeaderComponent } from './landing-header.component';
import { LandingFooterBannerComponent } from './landing-footer-banner.component';
import { LandingFooterSignatureComponent } from './landing-footer-signature.component';
import { LandingScrollToTopComponent } from './landing-scroll-to-top.component';
import { type SocialLink } from '@portfolio/shared/types';

@Component({
  selector: 'landing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingHeaderComponent,
    LandingFooterBannerComponent,
    LandingFooterSignatureComponent,
    LandingScrollToTopComponent,
  ],
  template: `
    <div class="flex min-h-screen flex-col bg-ink-0 text-landing-text-300">
      <landing-header />
      <main class="flex-1">
        <ng-content />
      </main>
      <landing-footer-banner
        id="shell-footer-banner"
        [fullName]="fullName()"
        [tagline]="footerTagline()"
        [email]="email()"
        [socialLinks]="socialLinks()"
      />
      <landing-footer-signature [fullName]="fullName()" [socialLinks]="socialLinks()" />
      <landing-scroll-to-top />
    </div>
  `,
})
export class LandingShellComponent {
  readonly fullName = input<string>('');
  readonly email = input<string>('');
  readonly footerTagline = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);
}
