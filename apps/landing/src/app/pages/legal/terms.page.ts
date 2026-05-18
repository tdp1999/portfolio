import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  LandingBreadcrumbComponent,
  LandingLinkComponent,
  LandingSectionHeaderComponent,
  SectionComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { useLegalPage } from './use-legal-page';

@Component({
  selector: 'landing-terms-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    SectionComponent,
    LandingBreadcrumbComponent,
    LandingLinkComponent,
    LandingSectionHeaderComponent,
  ],
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
})
export class TermsPage {
  private readonly state = useLegalPage({
    path: '/terms',
    titles: {
      en: 'Terms of Use | Phuong Tran',
      vi: 'Điều khoản Sử dụng | Trần Đức Phương',
    },
    descriptions: {
      en: 'Terms governing your access to and use of thunderphong.com — IP rights, acceptable use, no warranty, governing law of Vietnam.',
      vi: 'Điều khoản chi phối việc truy cập và sử dụng thunderphong.com — quyền sở hữu trí tuệ, sử dụng được chấp nhận, không bảo đảm, luật áp dụng Việt Nam.',
    },
  });

  protected readonly locale = this.state.locale;

  protected readonly breadcrumbEn: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Terms' }];
  protected readonly breadcrumbVi: readonly BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Điều khoản' },
  ];

  protected readonly lastUpdatedEn = 'Last updated 2026-05-18';
  protected readonly lastUpdatedVi = 'Cập nhật lần cuối 18/05/2026';
}
