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
  selector: 'landing-privacy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, LandingLinkComponent, LandingPageShellComponent, LandingTComponent],
  templateUrl: './privacy.page.html',
  styleUrls: ['./privacy.page.scss'],
})
export class PrivacyPage {
  private readonly state = useLegalPage({
    path: '/privacy',
    titles: {
      en: 'Privacy Policy | Phuong Tran',
      vi: 'Chính sách Bảo mật | Trần Đức Phương',
    },
    descriptions: {
      en: 'How thunderphong.com collects, uses, stores, and protects personal data — minimal data approach, no tracking cookies, transparent processor list.',
      vi: 'Cách thunderphong.com thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân — nguyên tắc dữ liệu tối thiểu, không cookie tracking, danh sách bên xử lý minh bạch.',
    },
  });

  protected readonly locale = this.state.locale;

  private readonly breadcrumbEn: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Privacy' }];
  private readonly breadcrumbVi: readonly BreadcrumbItem[] = [{ label: 'Trang chủ', href: '/' }, { label: 'Bảo mật' }];

  protected readonly breadcrumb = computed(() => (this.locale() === 'vi' ? this.breadcrumbVi : this.breadcrumbEn));
}
