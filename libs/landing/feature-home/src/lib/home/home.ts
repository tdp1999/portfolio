import { Component, computed, inject, PLATFORM_ID } from '@angular/core';
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
import { ProfileService, SkillService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
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
  bioLong = computed(() => getLocalized(this.profile()?.bioLong, this.locale()));
  bioShort = computed(() => getLocalized(this.profile()?.bioShort, this.locale()));
  isOpenToWork = computed(() => this.profile()?.availability === 'OPEN_TO_WORK');
  locationCity = computed(() => this.profile()?.locationCity ?? null);
  email = computed(() => this.profile()?.email ?? '');
  timezones = computed<readonly string[]>(() => this.profile()?.timezones ?? []);
  workingHours = computed(() => this.profile()?.workingHours ?? null);
  /** Splits bioShort at the first sentence boundary so the Outlook card has
   *  a lead clause + an italicized emphasis tail. Mirrors the hero tagline split. */
  private readonly bioShortSplit = computed<readonly [string, string]>(() => {
    const raw = this.bioShort().trim();
    if (!raw) return ['', ''];
    const match = raw.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
    if (match) return [match[1].trim(), match[2].replace(/\s+/g, ' ').trim()];
    return [raw, ''];
  });
  philosophyLead = computed(() => this.bioShortSplit()[0]);
  philosophyEmphasis = computed(() => this.bioShortSplit()[1]);
  contactNote = computed(() => {
    const intro = getLocalized(this.profile()?.contactIntro, this.locale());
    return intro || 'Open to talks · engagements from June';
  });
  socialLinks = computed(() => this.profile()?.socialLinks ?? []);

  constructor() {
    this.scrollspy.setSections(this.navSections);

    this.browserTitle.setTitle('Phuong Tran - Software Engineer');
    this.browserMeta.updateTag({
      name: 'description',
      content:
        'A software engineer specializing in TypeScript and Angular, with a passion for crafting performant and accessible web applications.',
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
