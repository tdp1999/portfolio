import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Link,
  PageShell,
  LandingScrollspyService,
  T,
  TocInline,
  TocSidebar,
  Container,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { useLegalPage } from './use-legal-page';
import { SECTIONS_EN, SECTIONS_VI } from './privacy.data';

@Component({
  selector: 'landing-privacy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Link, PageShell, T, TocInline, TocSidebar],
  providers: [LandingScrollspyService],
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.scss'],
})
export class Privacy {
  private readonly state = useLegalPage({
    path: '/privacy',
    titles: {
      en: 'Privacy Policy | Phuong Tran',
      vi: 'Chính sách Bảo mật | Trần Đức Phương',
    },
    descriptions: {
      en: 'How thunderphong.com collects, uses, stores, and protects personal data. Minimal data, no tracking cookies, a transparent processor list.',
      vi: 'Cách thunderphong.com thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân. Nguyên tắc dữ liệu tối thiểu, không cookie tracking, danh sách bên xử lý minh bạch.',
    },
    sections: { en: SECTIONS_EN, vi: SECTIONS_VI },
  });

  protected readonly locale = this.state.locale;
  protected readonly sections = this.state.sections;
  protected readonly tocLabel = this.state.tocLabel;

  private readonly breadcrumbEn: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Privacy' }];
  private readonly breadcrumbVi: readonly BreadcrumbItem[] = [{ label: 'Trang chủ', href: '/' }, { label: 'Bảo mật' }];

  protected readonly breadcrumb = computed(() => (this.locale() === 'vi' ? this.breadcrumbVi : this.breadcrumbEn));
}
