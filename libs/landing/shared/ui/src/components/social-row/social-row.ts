import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SOCIAL_PLATFORM_LABELS } from '@portfolio/shared/enum-labels';
import { type SocialLink, type SocialPlatform } from '@portfolio/shared/types';
import { Icon } from '../icon';

type SocialIcon = { readonly icon: string; readonly url: string; readonly label: string };

const SOCIAL_ICON: Record<SocialPlatform, string> = {
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  BLUESKY: 'external-link',
  STACKOVERFLOW: 'external-link',
  DEV_TO: 'external-link',
  HASHNODE: 'external-link',
  TELEGRAM: 'external-link',
  ZALO: 'external-link',
  WEBSITE: 'globe',
  OTHER: 'external-link',
};

/**
 * Compact icon row for a profile's social links. Renders a `<ul>` of
 * external-link icons. Cap with `max` (0 = no cap). Used in the bio card
 * grid Card C and the global footer signature.
 */
@Component({
  selector: 'landing-social-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    @if (icons().length > 0) {
      <ul class="social-row" role="list">
        @for (icon of icons(); track icon.url) {
          <li>
            <a
              class="social-row__link"
              [attr.href]="icon.url"
              target="_blank"
              rel="noopener noreferrer"
              [attr.aria-label]="icon.label"
            >
              <landing-icon [name]="icon.icon" [size]="iconSize()" />
            </a>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './social-row.scss',
})
export class SocialRow {
  readonly socialLinks = input<readonly SocialLink[]>([]);
  readonly iconSize = input<number>(18);
  /** Maximum icons to render. 0 = no cap. Default 0. */
  readonly max = input<number>(0);

  protected readonly icons = computed<readonly SocialIcon[]>(() => {
    const list = this.socialLinks().map((s) => ({
      icon: SOCIAL_ICON[s.platform] ?? 'external-link',
      url: s.url,
      label: SOCIAL_PLATFORM_LABELS[s.platform] ?? 'External link',
    }));
    const cap = this.max();
    return cap > 0 ? list.slice(0, cap) : list;
  });
}
