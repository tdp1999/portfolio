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
import { privacySections } from './privacy.data';

@Component({
  selector: 'landing-privacy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Link, PageShell, T, TocInline, TocSidebar, LandingCopyPipe],
  providers: [LandingScrollspyService],
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.scss'],
})
export class Privacy {
  private readonly state = useLegalPage({
    path: '/privacy',
    titleKey: 'legal.privacy.meta.title',
    descriptionKey: 'legal.privacy.meta.description',
    sections: { en: privacySections('en'), vi: privacySections('vi') },
  });

  protected readonly locale = this.state.locale;
  protected readonly sections = this.state.sections;
  protected readonly tocLabel = this.state.tocLabel;

  protected readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.privacy', locale) },
    ];
  });
}
