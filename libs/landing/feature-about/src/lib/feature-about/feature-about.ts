import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import {
  LandingFloatingPillNavComponent,
  LandingLocaleService,
  LandingPageShellComponent,
  LandingScrollspyService,
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { LandingAboutHeroComponent } from '../components/about-hero/about-hero';
import { LandingAboutExperienceComponent } from '../components/about-experience/about-experience';
import { LandingAboutHowIThinkComponent } from '../components/about-how-i-think/about-how-i-think';
import { LandingAboutFailuresComponent } from '../components/about-failures/about-failures';
import { LandingAboutCtaComponent } from '../components/about-cta/about-cta';

const ABOUT_URL = 'https://thunderphong.com/about';

const TITLE_BY_LOCALE = {
  en: 'About — Phương Trần',
  vi: 'Về tôi — Phương Trần',
} as const;

/** Fallback hero copy — used when `Profile.aboutHeading` / `aboutLede` is
 *  null (fresh DB, or pre-seed). Kept tight + locale-aware so the page never
 *  flashes a blank H1 while the author is still wiring console content. */
const DEFAULT_HEADING_BY_LOCALE = {
  en: 'Senior software engineer building DDD-grade web platforms for fintech & SaaS teams.',
  vi: 'Kỹ sư phần mềm xây dựng nền tảng web DDD cho các đội fintech & SaaS.',
} as const;
const DEFAULT_LEDE_BY_LOCALE = {
  en: 'Six years shipping production systems — payments, dashboards, content tools. I keep teams honest about complexity and trade-offs, and I am picky about who I work with.',
  vi: 'Sáu năm xây dựng hệ thống production — payments, dashboard, content tools. Mình giúp team giữ thái độ trung thực với độ phức tạp và đánh đổi, và khá kén chọn đối tác làm cùng.',
} as const;

@Component({
  selector: 'landing-feature-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingPageShellComponent,
    LandingFloatingPillNavComponent,
    LandingAboutHeroComponent,
    LandingAboutExperienceComponent,
    LandingAboutHowIThinkComponent,
    LandingAboutFailuresComponent,
    LandingAboutCtaComponent,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './feature-about.html',
  styleUrl: './feature-about.scss',
})
export class FeatureAbout {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly localeService = inject(LandingLocaleService);
  private readonly profileService = inject(ProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });
  protected readonly locale = this.localeService.locale;

  /** Author-managed via Console; falls back to the per-locale defaults when
   *  the field is null (pre-seed or unconfigured). Template uses `||` so an
   *  empty string from a half-translated locale also falls back. */
  protected readonly aboutHeading = computed(() => getLocalized(this.profile()?.aboutHeading, this.locale()));
  protected readonly aboutLede = computed(() => getLocalized(this.profile()?.aboutLede, this.locale()));
  protected readonly defaultAboutHeading = computed(() => DEFAULT_HEADING_BY_LOCALE[this.locale()]);
  protected readonly defaultAboutLede = computed(() => DEFAULT_LEDE_BY_LOCALE[this.locale()]);

  constructor() {
    this.scrollspy.setSections(this.navSections);

    // Title + meta tags react to locale and profile (for og:image).
    effect(() => {
      const locale = this.localeService.locale();
      const docTitle = TITLE_BY_LOCALE[locale];
      const description = this.aboutLede() || DEFAULT_LEDE_BY_LOCALE[locale];

      this.title.setTitle(docTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: docTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:type', content: 'profile' });
      this.meta.updateTag({ property: 'og:url', content: ABOUT_URL });

      const ogImage = this.profile()?.ogImageUrl;
      if (ogImage) {
        this.meta.updateTag({ property: 'og:image', content: ogImage });
      }
    });

    // JSON-LD Person schema — SSR only so crawlers see it in the initial HTML.
    // Same pattern as /home; schema is shared (one Person per site) so the
    // /about copy is the canonical place crawlers land for the hiring funnel.
    if (isPlatformServer(this.platformId)) {
      this.profileService
        .getJsonLd(this.localeService.locale())
        .pipe(catchError(() => EMPTY))
        .subscribe((jsonLd) => {
          const script = this.document.createElement('script');
          script.setAttribute('type', 'application/ld+json');
          script.textContent = JSON.stringify(jsonLd);
          this.document.head.appendChild(script);
        });
    }
  }

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'About' }];

  /** Section anchors fed to the floating pill + minimap. Hero is the page
   *  header (no anchor) — when the user is scrolled at the top, the pill
   *  defaults to Experience as the active section. */
  readonly navSections: readonly InPageSection[] = [
    { id: 'experience', title: 'Experience' },
    { id: 'how-i-think', title: 'How I think' },
    { id: 'failures', title: 'Failures' },
    { id: 'cta', title: 'Next steps' },
  ];
}
