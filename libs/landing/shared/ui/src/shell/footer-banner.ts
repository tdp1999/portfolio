import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type SocialLink } from '@portfolio/shared/types';
import { Background } from '../components/background';
import { Container } from '../components/container';
import { Eyebrow } from '../components/eyebrow';
import { Link } from '../components/link';

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
  imports: [Background, Container, Eyebrow, Link],
  templateUrl: './footer-banner.html',
  styleUrl: './footer-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterBanner {
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
        { label: 'About', href: '/about' },
        { label: 'Projects', href: '/projects' },
        { label: 'Contact', href: '/#get-in-touch' },
      ],
    },
    {
      title: 'Legal',
      routes: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  ];
}
