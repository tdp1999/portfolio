import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import {
  FloatingPillNav,
  LandingLocaleService,
  PageShell,
  LandingScrollspyService,
  type BreadcrumbItem,
  type InPageSection,
  resolveCopy,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { AboutHero } from '../about.hero/about.hero';
import { AboutExperience } from '../about.experience/about.experience';
import { AboutHowIThink } from '../about.how-i-think/about.how-i-think';
import { AboutFailures } from '../about.failures/about.failures';
import { AboutCta } from '../about.cta/about.cta';

@Component({
  selector: 'landing-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageShell, FloatingPillNav, AboutHero, AboutExperience, AboutHowIThink, AboutFailures, AboutCta],
  providers: [LandingScrollspyService],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  private readonly seo = inject(LandingMetaService);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly localeService = inject(LandingLocaleService);
  private readonly profileService = inject(ProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  protected readonly locale = this.localeService.locale;
  protected readonly aboutHeading = computed(() => getLocalized(this.profile()?.aboutHeading, this.locale()));
  protected readonly aboutLede = computed(() => getLocalized(this.profile()?.aboutLede, this.locale()));
  protected readonly defaultAboutHeading = computed(() => resolveCopy('about.meta.defaultHeading', this.locale()));
  protected readonly defaultAboutLede = computed(() => resolveCopy('about.meta.defaultLede', this.locale()));

  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const locale = this.locale();
    return [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.about', locale) },
    ];
  });
  /** Titles come from the same keys the section eyebrows read, so the pill and
   *  the heading it scrolls to can never drift apart. */
  readonly navSections = computed<readonly InPageSection[]>(() => {
    const locale = this.locale();
    return [
      { id: 'experience', title: resolveCopy('about.section.experience', locale) },
      { id: 'how-i-think', title: resolveCopy('about.section.howIThink', locale) },
      { id: 'failures', title: resolveCopy('about.section.failures', locale) },
      { id: 'cta', title: resolveCopy('about.section.nextSteps', locale) },
    ];
  });

  constructor() {
    // Re-registered on locale change: the scrollspy holds the titles it renders.
    effect(() => this.scrollspy.setSections(this.navSections()));

    // Title + meta tags react to locale and profile (for og:image).
    effect(() => {
      const locale = this.localeService.locale();
      const docTitle = resolveCopy('about.meta.title', locale);
      const description = this.aboutLede() || resolveCopy('about.meta.defaultLede', locale);

      const ogImage = this.profile()?.ogImageUrl;
      this.seo.apply({
        title: docTitle,
        description,
        path: '/about',
        type: 'profile',
        image: ogImage || undefined,
        imageAlt: ogImage ? 'Phuong Tran, Frontend Engineer' : undefined,
      });
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
}
