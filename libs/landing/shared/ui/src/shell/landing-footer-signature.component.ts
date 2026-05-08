import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ContainerComponent } from '../components/container';
import { IconComponent } from '../components/icon';
import { SOCIAL_PLATFORM_LABELS } from '@portfolio/shared/enum-labels';
import { type SocialLink, type SocialPlatform } from '@portfolio/shared/types';

type SocialIcon = { readonly icon: string; readonly url: string; readonly label: string };

const SOCIAL_ICON: Record<SocialPlatform, string> = {
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  BLUESKY: 'external-link',
  STACKOVERFLOW: 'external-link',
  DEV_TO: 'external-link',
  HASHNODE: 'external-link',
  WEBSITE: 'globe',
  OTHER: 'external-link',
};

/**
 * Site-wide footer signature — copyright on the left, social icons on the right.
 * Renders below every page (mounted by `landing-shell`). Pure presentational —
 * the host app injects `ProfileService` and forwards `fullName` / `socialLinks`.
 */
@Component({
  selector: 'landing-footer-signature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, IconComponent],
  template: `
    <footer class="border-t border-landing-border" role="contentinfo">
      <landing-container size="wide">
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-8">
          <p class="m-0 font-mono text-mono-md uppercase tracking-[0.06em] text-landing-text-500">
            © {{ year }} {{ fullName() || 'Portfolio' }}. All rights reserved.
          </p>
          @if (socialIcons().length > 0) {
            <ul class="m-0 flex list-none items-center gap-4 p-0" role="list">
              @for (social of socialIcons(); track social.url) {
                <li>
                  <a
                    class="footer-signature__social inline-flex h-8 w-8 items-center justify-center rounded-md text-landing-text-500 transition-colors duration-150 hover:bg-ink-2 hover:text-landing-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-landing-accent focus-visible:outline-offset-2"
                    [attr.href]="social.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    [attr.aria-label]="social.label"
                  >
                    <landing-icon [name]="social.icon" [size]="18" />
                  </a>
                </li>
              }
            </ul>
          }
        </div>
      </landing-container>
    </footer>
  `,
})
export class LandingFooterSignatureComponent {
  readonly fullName = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);

  protected readonly year = new Date().getFullYear();

  protected readonly socialIcons = computed<readonly SocialIcon[]>(() =>
    this.socialLinks().map((s) => ({
      icon: SOCIAL_ICON[s.platform] ?? 'external-link',
      url: s.url,
      label: SOCIAL_PLATFORM_LABELS[s.platform] ?? 'External link',
    }))
  );
}
