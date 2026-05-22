import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  LandingFloatingPillNavComponent,
  LandingPageShellComponent,
  LandingScrollspyService,
  LandingTComponent,
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { LandingAboutHeroComponent } from '../components/about-hero/about-hero';
import { LandingAboutExperienceComponent } from '../components/about-experience/about-experience';
import { LandingAboutHowIThinkComponent } from '../components/about-how-i-think/about-how-i-think';
import { LandingAboutFailuresComponent } from '../components/about-failures/about-failures';
import { LandingAboutCtaComponent } from '../components/about-cta/about-cta';

@Component({
  selector: 'landing-feature-about',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LandingPageShellComponent,
    LandingTComponent,
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

  constructor() {
    this.title.setTitle('About | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Senior software engineer — work history, principles, and what I am shipping now.',
    });
    this.scrollspy.setSections(this.navSections);
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
