import { Component, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformServer, DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ContainerComponent,
  SectionComponent,
  IconComponent,
  CardComponent,
  BadgeComponent,
} from '@portfolio/landing/shared/ui';
import { TranslatablePipe, DateRangePipe } from '@portfolio/shared/ui/pipes';
import { HomeHeroComponent } from '../hero/home-hero.component';
import { ProfileService, ExperienceService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';

@Component({
  selector: 'landing-feature-home',
  imports: [
    RouterLink,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    CardComponent,
    BadgeComponent,
    HomeHeroComponent,
    TranslatablePipe,
    DateRangePipe,
  ],
  templateUrl: './feature-home.html',
  styleUrl: './feature-home.scss',
})
export class FeatureHome {
  private profileService = inject(ProfileService);
  private experienceService = inject(ExperienceService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);

  locale = signal<Locale>('en');
  profile = toSignal(this.profileService.getPublicProfile(), { initialValue: null });
  experiences = toSignal(this.experienceService.getPublicExperiences(), { initialValue: [] });

  recentExperiences = computed(() => this.experiences().slice(0, 3));

  stackIntro = computed(() => getLocalized(this.profile()?.stackIntro, this.locale()));

  fullName = computed(() => getLocalized(this.profile()?.fullName, this.locale()) || 'Portfolio in progress');
  title = computed(() => getLocalized(this.profile()?.title, this.locale()));
  tagline = computed(() => getLocalized(this.profile()?.tagline, this.locale()));
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
}
