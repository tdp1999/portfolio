import { ChangeDetectionStrategy, Component, effect, inject, computed } from '@angular/core';
import {
  Container,
  ContentSection,
  PageShell,
  LandingCopyPipe,
  LandingLocaleService,
  formatMonthYear,
  resolveCopy,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import { usesBreadcrumb, LAST_UPDATED, usesSections } from './uses.data';

@Component({
  selector: 'landing-uses',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, ContentSection, LandingCopyPipe],
  templateUrl: './uses.html',
  styleUrls: ['./uses.scss'],
})
export class Uses {
  // ──────── Injections ─────────────────────────────────────────────────
  private readonly seo = inject(LandingMetaService);

  // ──────── Data ────────────────────────────────────────────────────────
  protected readonly locale = inject(LandingLocaleService).locale;
  readonly breadcrumb = computed(() => usesBreadcrumb(this.locale()));
  readonly sections = computed(() => usesSections(this.locale()));
  /** raw ISO for the `datetime` attribute, so crawlers and screen readers agree */
  readonly lastUpdated = LAST_UPDATED;
  readonly lastUpdatedLabel = computed(() => formatMonthYear(new Date(LAST_UPDATED), this.locale()));

  // ──────── Constructor ─────────────────────────────────────────────────
  constructor() {
    // In an effect so the tags follow a locale change, matching /about and /404.
    effect(() => {
      const locale = this.locale();
      const title = resolveCopy('uses.meta.title', locale);
      const description = resolveCopy('uses.meta.description', locale);
      this.seo.apply({ title, description });
    });
  }
}
