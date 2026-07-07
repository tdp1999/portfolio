import { Component, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY } from 'rxjs';
import { HomeBioCardGrid } from '../home.bio-card-grid/home.bio-card-grid';
import { HomeGetInTouch } from '../home.get-in-touch/home.get-in-touch';
import { HomeHero } from '../home.hero/home.hero';
import { HomeIntro } from '../home.intro/home.intro';
import { HomePhilosophyStrip } from '../home.philosophy-strip/home.philosophy-strip';
import { HomeSelectedWork } from '../selected-work/home.selected-work';
import { HomeStack } from '../home.stack/home.stack';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  ProfileService,
  SkillService,
} from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import {
  FloatingPillNav,
  LandingLocaleService,
  LandingScrollspyService,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'landing-home',
  imports: [
    HomeBioCardGrid,
    HomeGetInTouch,
    HomeHero,
    HomeIntro,
    HomePhilosophyStrip,
    HomeSelectedWork,
    HomeStack,
    FloatingPillNav,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private profileService = inject(ProfileService);
  private skillService = inject(SkillService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private scrollspy = inject(LandingScrollspyService);
  private localeService = inject(LandingLocaleService);

  private readonly browserTitle = inject(Title);
  private readonly browserMeta = inject(Meta);

  /** Sections fed to the floating pill + minimap. Skipping philosophy strip
   *  (transition) and footer banner (terminus) keeps the trail to 6 stops. */
  readonly navSections: readonly InPageSection[] = [
    { id: 'hero', title: 'Hero' },
    { id: 'who', title: 'Who' },
    { id: 'work', title: 'Selected Work' },
    { id: 'stack', title: 'The Stack' },
    { id: 'story', title: 'The Story' },
    { id: 'get-in-touch', title: 'Get in Touch' },
  ];

  locale = this.localeService.locale;
  profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });
  skillTierGroups = toSignal(this.skillService.getSkillsByTier(), { initialValue: [] });

  profileLoaded = computed(() => this.profile() !== null);

  fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()) || 'Portfolio in progress');
  title = computed(() => getLocalized(this.profile()?.title, this.locale()));
  tagline = computed(() => getLocalized(this.profile()?.tagline, this.locale()));
  stackIntro = computed(() => getLocalized(this.profile()?.stackIntro, this.locale()));
  selectedWorkIntro = computed(() => getLocalized(this.profile()?.selectedWorkIntro, this.locale()));
  coreStack = computed<readonly string[]>(() => this.profile()?.coreStack ?? []);
  // Canonical story doc, localized. Null (→ story hidden) until authored/backfilled;
  // mirrors project-detail's `bodyDoc` guard so an empty doc never renders a blank §.
  bioDoc = computed<PortableDocument | null>(() => {
    const doc = getLocalized(this.profile()?.bioLongCanonical, this.locale()) as unknown as PortableDocument | null;
    return doc && Array.isArray(doc.content) && doc.content.length > 0 ? doc : null;
  });
  /** OUTLOOK card quote (Card B) — rendered as one uniform passage. */
  bioShort = computed(() => getLocalized(this.profile()?.bioShort, this.locale()));
  // Hero (§2) availability status — Card C's duplicate status-dot was removed.
  isOpenToWork = computed(() => this.profile()?.availability === 'OPEN_TO_WORK');
  locationCity = computed(() => this.profile()?.locationCity ?? null);
  email = computed(() => this.profile()?.email ?? '');
  timezones = computed<readonly string[]>(() => this.profile()?.timezones ?? []);
  workingHours = computed(() => this.profile()?.workingHours ?? null);
  contactNote = computed(() => {
    const intro = getLocalized(this.profile()?.contactIntro, this.locale());
    return intro || 'Open to talks · engagements from June';
  });
  // Card C brand row — data-driven: renders whatever the author sets in the
  // Console Links dropdown (LinkedIn / GitHub / Zalo / …), in order, capped by
  // the row's `max`. Zalo just needs a ZALO link entry (brand icon wired).
  socialLinks = computed(() => this.profile()?.socialLinks ?? []);

  constructor() {
    this.scrollspy.setSections(this.navSections);

    // Homepage <title> + description + OG come from the SEO/OG profile fields
    // (Console → /profile → SEO / OG), falling back to the site defaults when
    // unset. In an effect because `profile` resolves async.
    effect(() => {
      const p = this.profile();
      const title = p?.metaTitle || DEFAULT_TITLE;
      const description = p?.metaDescription || DEFAULT_DESCRIPTION;
      this.browserTitle.setTitle(title);
      this.browserMeta.updateTag({ name: 'description', content: description });
      this.browserMeta.updateTag({ property: 'og:title', content: title });
      this.browserMeta.updateTag({ property: 'og:description', content: description });
      this.browserMeta.updateTag({ name: 'twitter:title', content: title });
      this.browserMeta.updateTag({ name: 'twitter:description', content: description });
    });

    if (isPlatformServer(this.platformId)) {
      this.profileService
        .getJsonLd(this.locale())
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
