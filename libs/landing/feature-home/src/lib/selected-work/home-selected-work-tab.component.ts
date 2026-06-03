import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  ChipComponent,
  LandingCarouselComponent,
  LandingGalleryComponent,
  LandingLinkComponent,
  type GalleryImage,
} from '@portfolio/landing/shared/ui';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import type { ProjectDetail } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';
import { buildLinkGroups, projectYear, type LinkGroup } from './selected-work-shared';

@Component({
  selector: 'landing-home-selected-work-tab',
  standalone: true,
  imports: [ChipComponent, LandingGalleryComponent, LandingCarouselComponent, LandingLinkComponent],
  templateUrl: './home-selected-work-tab.component.html',
  styleUrl: './home-selected-work-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkTabComponent {
  readonly project = input.required<ProjectDetail>();
  readonly locale = input<Locale>('en');

  private readonly breakpoint = inject(BreakpointObserverService);

  /**
   * Component-swap, not a CSS reflow: the curated grid is a desktop affordance;
   * on laptop+ keep `landing-gallery`, below it swap to the full-feature
   * `landing-carousel`. SSR defaults to the widest BP, so the grid renders first
   * and there is no hydration flash of the wrong component on desktop.
   */
  protected readonly useGrid = computed(() => this.breakpoint.isAtLeast('laptop'));

  protected readonly title = computed(() => this.project().title);
  protected readonly year = computed(() => projectYear(this.project().startDate));
  protected readonly role = computed(() => getLocalized(this.project().role, this.locale()));

  protected readonly descriptionRuns = computed(() => {
    const text = getLocalized(this.project().description, this.locale());
    return parseItalicRuns(text);
  });

  /** Always-on inline "read more" link target — project detail (Case Study) page. */
  protected readonly caseStudyHref = computed(() => `/projects/${this.project().slug}`);

  /** Per-project lightbox group so each project's screenshots navigate together. */
  protected readonly lightboxGroup = computed(() => `selected-work-${this.project().slug}`);

  protected readonly linkGroups = computed<readonly LinkGroup[]>(() => buildLinkGroups(this.project().links));

  protected readonly skills = computed(() => this.project().skills);

  protected readonly galleryImages = computed<readonly GalleryImage[]>(() => {
    const p = this.project();
    const fallbackCaption = p.slug.toUpperCase().replace(/-/g, ' ');
    return (p.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt ?? '',
      caption: img.alt || fallbackCaption,
    }));
  });
}
