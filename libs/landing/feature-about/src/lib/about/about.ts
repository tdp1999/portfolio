import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import {
  FloatingPillNav,
  LandingLocaleService,
  PageShell,
  LandingScrollspyService,
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { AboutHero } from '../about.hero/about.hero';
import { AboutExperience } from '../about.experience/about.experience';
import { AboutHowIThink } from '../about.how-i-think/about.how-i-think';
import { AboutFailures } from '../about.failures/about.failures';
import { AboutCta } from '../about.cta/about.cta';
import { ABOUT_URL, TITLE_BY_LOCALE, DEFAULT_HEADING_BY_LOCALE, DEFAULT_LEDE_BY_LOCALE } from './about.data';

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
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly localeService = inject(LandingLocaleService);
  private readonly profileService = inject(ProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  protected readonly locale = this.localeService.locale;
  protected readonly aboutHeading = computed(() => getLocalized(this.profile()?.aboutHeading, this.locale()));
  protected readonly aboutLede = computed(() => getLocalized(this.profile()?.aboutLede, this.locale()));
  protected readonly defaultAboutHeading = computed(() => DEFAULT_HEADING_BY_LOCALE[this.locale()]);
  protected readonly defaultAboutLede = computed(() => DEFAULT_LEDE_BY_LOCALE[this.locale()]);

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'About' }];
  readonly navSections: readonly InPageSection[] = [
    { id: 'experience', title: 'Experience' },
    { id: 'how-i-think', title: 'How I think' },
    { id: 'failures', title: 'Failures' },
    { id: 'cta', title: 'Next steps' },
  ];

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
}
