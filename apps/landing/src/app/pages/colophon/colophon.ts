import { ChangeDetectionStrategy, Component, effect, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Container,
  ContentSection,
  PageShell,
  type BreadcrumbItem,
  LandingCopyPipe,
  LandingLocaleService,
  formatMonthYear,
  resolveCopy,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import { colophonSections, LAST_UPDATED } from './colophon.data';

@Component({
  selector: 'landing-colophon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Container, PageShell, ContentSection, LandingCopyPipe],
  templateUrl: './colophon.html',
  styleUrls: ['./colophon.scss'],
})
export class Colophon {
  protected readonly locale = inject(LandingLocaleService).locale;
  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.colophon', locale) },
    ];
  });
  readonly sections = computed(() => colophonSections(this.locale()));
  /** raw ISO for the `datetime` attribute, so crawlers and screen readers agree */
  readonly lastUpdated = LAST_UPDATED;
  readonly lastUpdatedLabel = computed(() => formatMonthYear(new Date(LAST_UPDATED), this.locale()));

  private readonly seo = inject(LandingMetaService);

  constructor() {
    // In an effect so the tags follow a locale change, matching /about and /404.
    effect(() => {
      const locale = this.locale();
      const title = resolveCopy('colophon.meta.title', locale);
      const description = resolveCopy('colophon.meta.description', locale);
      this.seo.apply({ title, description });
    });
  }
}
