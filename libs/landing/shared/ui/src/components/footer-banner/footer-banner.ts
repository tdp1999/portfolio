import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { type SocialLink } from '@portfolio/shared/types';
import { Wordmark } from '@portfolio/shared/features/brand';
import { Background } from '../background';
import { Container } from '../container';
import { Eyebrow } from '../eyebrow';
import { Link } from '../link';
import { UmamiEventDirective } from '../../directives/umami-event/umami-event.directive';
import { resolveCopy } from '../../services/copy';
import { LandingLocaleService } from '../../services/locale/landing-locale.service';
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
  private readonly locale = inject(LandingLocaleService).locale;
  protected readonly siteMapLabel = computed(() => resolveCopy('a11y.nav.siteMap', this.locale()));

  protected readonly columns = computed<readonly FooterColumn[]>(() => {
    const l = this.locale();
    return [
      {
        title: resolveCopy('footer.column.general', l),
        routes: [
          { label: resolveCopy('common.page.home', l), href: '/' },
          { label: resolveCopy('common.page.blog', l), href: '/blog' },
          { label: resolveCopy('common.page.contact', l), href: '/contact' },
        ],
      },
      {
        title: resolveCopy('nav.explore', l),
        routes: [
          { label: resolveCopy('common.page.about', l), href: '/about' },
          { label: resolveCopy('common.page.projects', l), href: '/projects' },
          { label: resolveCopy('common.page.documentEngine', l), href: '/document-engine' },
          { label: resolveCopy('common.page.ddl', l), href: '/ddl' },
        ],
      },
      {
        title: resolveCopy('footer.column.legal', l),
        routes: [
          { label: resolveCopy('common.page.privacy', l), href: '/privacy' },
          { label: resolveCopy('common.page.terms', l), href: '/terms' },
        ],
      },
    ];
  });
}

export type { FooterRoute, FooterColumn } from './footer-banner.types';
