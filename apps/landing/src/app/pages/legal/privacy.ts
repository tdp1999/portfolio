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
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { useLegalPage } from './use-legal-page';

// In-page-nav sections — same anchor IDs as the <h2>s, concise localized titles.
const SECTIONS_EN: readonly InPageSection[] = [
  { id: 'who-i-am', title: '1. Who I am' },
  { id: 'scope', title: '2. Scope' },
  { id: 'data-collected', title: '3. Data I collect' },
  { id: 'processors', title: '4. Processors' },
  { id: 'transfers', title: '5. International transfers' },
  { id: 'rights', title: '6. Your rights' },
  { id: 'security', title: '7. Security' },
  { id: 'children', title: '8. Children' },
  { id: 'external-links', title: '9. Links to other sites' },
  { id: 'changes', title: '10. Changes' },
  { id: 'contact', title: '11. Contact' },
];
const SECTIONS_VI: readonly InPageSection[] = [
  { id: 'who-i-am', title: '1. Người tôi là' },
  { id: 'scope', title: '2. Phạm vi' },
  { id: 'data-collected', title: '3. Dữ liệu thu thập' },
  { id: 'processors', title: '4. Bên xử lý' },
  { id: 'transfers', title: '5. Truyền dữ liệu quốc tế' },
  { id: 'rights', title: '6. Quyền của bạn' },
  { id: 'security', title: '7. Bảo mật' },
  { id: 'children', title: '8. Trẻ em' },
  { id: 'external-links', title: '9. Liên kết ngoài' },
  { id: 'changes', title: '10. Thay đổi' },
  { id: 'contact', title: '11. Liên hệ' },
];

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
      en: 'How thunderphong.com collects, uses, stores, and protects personal data — minimal data approach, no tracking cookies, transparent processor list.',
      vi: 'Cách thunderphong.com thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân — nguyên tắc dữ liệu tối thiểu, không cookie tracking, danh sách bên xử lý minh bạch.',
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
