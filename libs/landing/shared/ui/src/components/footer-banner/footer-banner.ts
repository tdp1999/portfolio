import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type SocialLink } from '@portfolio/shared/types';
import { Wordmark } from '@portfolio/shared/features/brand';
import { Background } from '../background';
import { Container } from '../container';
import { Eyebrow } from '../eyebrow';
import { Link } from '../link';
import { UmamiEventDirective } from '../../directives/umami-event/umami-event.directive';
import type { FooterColumn } from './footer-banner.types';

/**
 * Site-wide footer banner — Parth-style fat site map (brand block + nav columns).
 * Mounted by `landing-shell` so it carries across every landing page; the §9
 * signature row lives in the sibling `landing-footer-signature` component.
 */
@Component({
  selector: 'landing-footer-banner',
  standalone: true,
  imports: [Background, Container, Eyebrow, Link, Wordmark, UmamiEventDirective],
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

export type { FooterRoute, FooterColumn } from './footer-banner.types';
