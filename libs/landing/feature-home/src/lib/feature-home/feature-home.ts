import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { HomeHeroComponent } from '../hero/home-hero.component';
import { HomeIntroComponent } from '../intro/home-intro.component';
import { HomeSectionPlaceholderComponent } from '../placeholders/home-section-placeholder.component';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';

@Component({
  selector: 'landing-feature-home',
  imports: [HomeHeroComponent, HomeIntroComponent, HomeSectionPlaceholderComponent],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  private profileService = inject(ProfileService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  locale = signal<Locale>('en');
  profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()) || 'Portfolio in progress');
  title = computed(() => getLocalized(this.profile()?.title, this.locale()));
  tagline = computed(() => getLocalized(this.profile()?.tagline, this.locale()));
  stackIntro = computed(() => getLocalized(this.profile()?.stackIntro, this.locale()));
  bioLong = computed(() => getLocalized(this.profile()?.bioLong, this.locale()));
  isOpenToWork = computed(() => this.profile()?.availability === 'OPEN_TO_WORK');
  locationCity = computed(() => this.profile()?.locationCity ?? null);

  constructor() {
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
