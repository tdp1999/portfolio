import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  LandingLinkComponent,
  LandingPageShellComponent,
  LandingTComponent,
  ContainerComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { useLegalPage } from './use-legal-page';

@Component({
  selector: 'landing-terms-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingLinkComponent, LandingPageShellComponent, LandingTComponent],
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

  private readonly breadcrumbEn: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Terms' }];
  private readonly breadcrumbVi: readonly BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Điều khoản' },
  ];

  protected readonly breadcrumb = computed(() => (this.locale() === 'vi' ? this.breadcrumbVi : this.breadcrumbEn));
}
