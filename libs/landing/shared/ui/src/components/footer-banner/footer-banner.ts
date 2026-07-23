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

  // Footer site-map — plain utility labels (scan-nav, not a voice surface).
  // Uses + Colophon deliberately omitted: they live in the header "More" mega-menu,
  // no need to repeat them here. Column title "Explore" (not "About") avoids
  // colliding with the "About" link it contains.
  protected readonly columns: readonly FooterColumn[] = [
    {
      title: 'General',
      routes: [
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Explore',
      routes: [
        { label: 'About', href: '/about' },
        { label: 'Projects', href: '/projects' },
        { label: 'Document Engine', href: '/document-engine' },
        { label: 'DDL', href: '/ddl' },
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
