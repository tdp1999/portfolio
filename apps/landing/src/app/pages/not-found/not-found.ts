import { ChangeDetectionStrategy, Component, inject, computed, effect } from '@angular/core';
import {
  Container,
  Link,
  PageShell,
  LandingLocaleService,
  LandingCopyPipe,
  T,
  resolveCopy,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';

import { notFoundBreadcrumb } from './not-found.data';

@Component({
  selector: 'landing-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, PageShell, Link, LandingCopyPipe, T],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
})
export class NotFound {
  private readonly seo = inject(LandingMetaService);

  protected readonly locale = inject(LandingLocaleService).locale;
  readonly breadcrumb = computed(() => notFoundBreadcrumb(this.locale()));

  constructor() {
    // `noindex` goes through `apply` rather than a one-off `updateTag`: the
    // service clears it on the next page, so a 404 cannot de-index whatever the
    // visitor navigates to next.
    effect(() => this.seo.apply({ title: resolveCopy('notFound.meta.title', this.locale()), noindex: true }));
  }
}
