import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeBioCardGridComponent } from '../bio-card-grid/home-bio-card-grid.component';
import { HomeGetInTouchComponent } from '../get-in-touch/home-get-in-touch.component';
import { HomeHeroComponent } from '../hero/home-hero.component';
import { HomeIntroComponent } from '../intro/home-intro.component';
import { HomePhilosophyStripComponent } from '../philosophy/home-philosophy-strip.component';
import { HomeSelectedWorkComponent } from '../selected-work/home-selected-work.component';
import { HomeStackComponent } from '../stack/home-stack.component';
import { ProfileService, SkillService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import {
  LandingFloatingPillNavComponent,
  LandingScrollspyService,
  type InPageSection,
} from '@portfolio/landing/shared/ui';

@Component({
  selector: 'landing-feature-home',
  imports: [
    HomeBioCardGridComponent,
    HomeGetInTouchComponent,
    HomeHeroComponent,
    HomeIntroComponent,
    HomePhilosophyStripComponent,
    HomeSelectedWorkComponent,
    HomeStackComponent,
    LandingFloatingPillNavComponent,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  private profileService = inject(ProfileService);
  private skillService = inject(SkillService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private scrollspy = inject(LandingScrollspyService);

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

  locale = signal<Locale>('en');
  profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });
  skillGroups = toSignal(this.skillService.getGroupedSkills(), { initialValue: [] });

  fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()) || 'Portfolio in progress');
  title = computed(() => getLocalized(this.profile()?.title, this.locale()));
  tagline = computed(() => getLocalized(this.profile()?.tagline, this.locale()));
  stackIntro = computed(() => getLocalized(this.profile()?.stackIntro, this.locale()));
  bioLong = computed(() => getLocalized(this.profile()?.bioLong, this.locale()));
  bioShort = computed(() => getLocalized(this.profile()?.bioShort, this.locale()));
  isOpenToWork = computed(() => this.profile()?.availability === 'OPEN_TO_WORK');
  locationCity = computed(() => this.profile()?.locationCity ?? null);
  email = computed(() => this.profile()?.email ?? '');
  timezones = computed<readonly string[]>(() => this.profile()?.timezones ?? []);
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
  contactCopy = computed(() => getLocalized(this.profile()?.contactIntro, this.locale()));
  socialLinks = computed(() => this.profile()?.socialLinks ?? []);
  resumeEntry = computed(() => {
    const urls = this.profile()?.resumeUrls;
    if (!urls) return null;
    return this.locale() === 'vi' ? (urls.vi ?? urls.en ?? null) : (urls.en ?? urls.vi ?? null);
  });

  constructor() {
    this.scrollspy.setSections(this.navSections);

    if (isPlatformServer(this.platformId)) {
      this.profileService.getJsonLd(this.locale()).subscribe((jsonLd) => {
        const script = this.document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(jsonLd);
        this.document.head.appendChild(script);
      });
    }
  }
}
