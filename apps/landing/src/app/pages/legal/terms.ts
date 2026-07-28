import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Link,
  PageShell,
  LandingScrollspyService,
  T,
  TocInline,
  TocSidebar,
  Container,
  LandingCopyPipe,
  resolveCopy,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { useLegalPage } from './use-legal-page';
import { termsSections } from './terms.data';

@Component({
  selector: 'landing-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Link, PageShell, T, TocInline, TocSidebar, LandingCopyPipe],
  providers: [LandingScrollspyService],
  templateUrl: './terms.html',
  styleUrls: ['./terms.scss'],
})
export class Terms {
  private readonly state = useLegalPage({
    path: '/terms',
    titleKey: 'legal.terms.meta.title',
    descriptionKey: 'legal.terms.meta.description',
    sections: { en: termsSections('en'), vi: termsSections('vi') },
  });

  protected readonly locale = this.state.locale;
  protected readonly sections = this.state.sections;
  protected readonly tocLabel = this.state.tocLabel;

  protected readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.terms', locale) },
    ];
  });
}
