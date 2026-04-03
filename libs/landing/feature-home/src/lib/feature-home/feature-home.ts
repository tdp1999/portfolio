import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ButtonComponent,
  ContainerComponent,
  SectionComponent,
  IconComponent,
  CardComponent,
  BadgeComponent,
} from '@portfolio/landing/shared/ui';
import { ProfileService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale, SocialPlatform } from '@portfolio/shared/types';

const SOCIAL_ICON_MAP: Record<SocialPlatform, string> = {
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  TWITTER: 'external-link',
  BLUESKY: 'globe',
  STACKOVERFLOW: 'code',
  DEV_TO: 'code',
  HASHNODE: 'code',
  WEBSITE: 'globe',
  OTHER: 'external-link',
};

@Component({
  selector: 'landing-feature-home',
  imports: [
    RouterLink,
    ButtonComponent,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    CardComponent,
    BadgeComponent,
  ],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  private profileService = inject(ProfileService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  readonly socialIconMap = SOCIAL_ICON_MAP;

  locale = signal<Locale>('en');
  profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });

  fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()) || 'Portfolio in progress');
  title = computed(() => getLocalized(this.profile()?.title, this.locale()));
  bioShort = computed(() => getLocalized(this.profile()?.bioShort, this.locale()));
  bioLong = computed(() => getLocalized(this.profile()?.bioLong, this.locale()));
  isOpenToWork = computed(() => this.profile()?.availability === 'OPEN_TO_WORK');
  openToLabels = computed(() => this.profile()?.openTo ?? []);
  socialLinks = computed(() => this.profile()?.socialLinks ?? []);
  resumeUrl = computed(() => this.profile()?.resumeUrls?.[this.locale()] ?? null);
  avatarUrl = computed(() => this.profile()?.avatarUrl ?? null);
  yearsOfExperience = computed(() => this.profile()?.yearsOfExperience ?? null);
  locationCity = computed(() => this.profile()?.locationCity ?? null);
  locationCountry = computed(() => this.profile()?.locationCountry ?? null);

  projects = [
    {
      id: 1,
      title: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory.',
      icon: 'shopping-cart',
      technologies: ['Angular', 'NestJS', 'PostgreSQL'],
    },
    {
      id: 2,
      title: 'Task Management App',
      description: 'Collaborative task management with real-time updates.',
      icon: 'check-square',
      technologies: ['React', 'Node.js', 'MongoDB'],
    },
    {
      id: 3,
      title: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard with interactive charts.',
      icon: 'bar-chart',
      technologies: ['Vue', 'D3.js', 'Firebase'],
    },
  ];

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

  getSocialIcon(platform: SocialPlatform): string {
    return this.socialIconMap[platform] ?? 'external-link';
  }
}
