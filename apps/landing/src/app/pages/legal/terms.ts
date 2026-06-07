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
  { id: 'the-site', title: '1. The Site' },
  { id: 'ip', title: '2. Intellectual property' },
  { id: 'acceptable-use', title: '3. Acceptable use' },
  { id: 'contact-form', title: '4. Contact form' },
  { id: 'links', title: '5. Links to other sites' },
  { id: 'no-warranty', title: '6. No warranty' },
  { id: 'liability', title: '7. Limitation of liability' },
  { id: 'privacy', title: '8. Privacy' },
  { id: 'changes', title: '9. Changes' },
  { id: 'governing-law', title: '10. Governing law' },
  { id: 'indemnification', title: '11. Indemnification' },
  { id: 'severability', title: '12. Severability' },
  { id: 'contact', title: '13. Contact' },
];
const SECTIONS_VI: readonly InPageSection[] = [
  { id: 'the-site', title: '1. Về Website' },
  { id: 'ip', title: '2. Sở hữu trí tuệ' },
  { id: 'acceptable-use', title: '3. Sử dụng chấp nhận' },
  { id: 'contact-form', title: '4. Biểu mẫu liên hệ' },
  { id: 'links', title: '5. Liên kết ngoài' },
  { id: 'no-warranty', title: '6. Không bảo đảm' },
  { id: 'liability', title: '7. Giới hạn trách nhiệm' },
  { id: 'privacy', title: '8. Bảo mật' },
  { id: 'changes', title: '9. Thay đổi' },
  { id: 'governing-law', title: '10. Luật áp dụng' },
  { id: 'indemnification', title: '11. Bồi hoàn' },
  { id: 'severability', title: '12. Hiệu lực từng phần' },
  { id: 'contact', title: '13. Liên hệ' },
];

@Component({
  selector: 'landing-terms',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Link, PageShell, T, TocInline, TocSidebar],
  providers: [LandingScrollspyService],
  templateUrl: './terms.html',
  styleUrls: ['./terms.scss'],
})
export class Terms {
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
    sections: { en: SECTIONS_EN, vi: SECTIONS_VI },
  });

  protected readonly locale = this.state.locale;
  protected readonly sections = this.state.sections;
  protected readonly tocLabel = this.state.tocLabel;

  private readonly breadcrumbEn: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Terms' }];
  private readonly breadcrumbVi: readonly BreadcrumbItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Điều khoản' },
  ];

  protected readonly breadcrumb = computed(() => (this.locale() === 'vi' ? this.breadcrumbVi : this.breadcrumbEn));
}
