import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LandingBackgroundComponent } from '../components/background';
import { ContainerComponent } from '../components/container';
import { EyebrowComponent } from '../components/eyebrow';
import { LandingLinkComponent } from '../components/link';
import { SOCIAL_PLATFORM_LABELS } from '@portfolio/shared/enum-labels';
import { type SocialLink } from '@portfolio/shared/types';

type FooterRoute = { readonly label: string; readonly href: string; readonly external?: boolean };
type FooterColumn = { readonly title: string; readonly routes: readonly FooterRoute[] };

/**
 * Site-wide footer banner — Parth-style fat site map (brand block + nav columns).
 * Mounted by `landing-shell` so it carries across every landing page; the §9
 * signature row lives in the sibling `landing-footer-signature` component.
 */
@Component({
  selector: 'landing-footer-banner',
  standalone: true,
  imports: [LandingBackgroundComponent, ContainerComponent, EyebrowComponent, LandingLinkComponent],
  templateUrl: './landing-footer-banner.component.html',
  styleUrl: './landing-footer-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooterBannerComponent {
  readonly fullName = input<string>('');
  readonly tagline = input<string>('');
  readonly email = input<string>('');
  readonly socialLinks = input<readonly SocialLink[]>([]);

  protected readonly columns: readonly FooterColumn[] = [
    {
      title: 'General',
      routes: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'Uses', href: '/uses' },
        { label: 'Colophon', href: '/colophon' },
      ],
    },
    {
      title: 'About',
      routes: [
        { label: 'Experience', href: '/experience' },
        { label: 'Projects', href: '/projects' },
        { label: 'Contact', href: '/#get-in-touch' },
      ],
    },
  ];

  protected readonly mailto = computed(() => (this.email() ? `mailto:${this.email()}` : ''));

  /** Connect column: email (mailto) first, then named social rows. */
  protected readonly connectRoutes = computed<readonly FooterRoute[]>(() => {
    const list: FooterRoute[] = [];
    const m = this.mailto();
    if (m) list.push({ label: 'Email', href: m });
    for (const s of this.socialLinks()) {
      list.push({ label: SOCIAL_PLATFORM_LABELS[s.platform] ?? 'External', href: s.url, external: true });
    }
    return list;
  });
}
