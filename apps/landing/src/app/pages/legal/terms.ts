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
import { SECTIONS_EN, SECTIONS_VI } from './terms.data';

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
