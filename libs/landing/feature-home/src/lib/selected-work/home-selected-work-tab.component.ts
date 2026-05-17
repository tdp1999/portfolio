import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ChipComponent,
  LandingGalleryComponent,
  LandingLinkComponent,
  type GalleryImage,
} from '@portfolio/landing/shared/ui';
import type { ProjectDetail } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';
import { buildLinkGroups, projectYear, type LinkGroup } from './selected-work-shared';

@Component({
  selector: 'landing-home-selected-work-tab',
  standalone: true,
  imports: [ChipComponent, LandingGalleryComponent, LandingLinkComponent],
  templateUrl: './home-selected-work-tab.component.html',
  styleUrl: './home-selected-work-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkTabComponent {
  readonly project = input.required<ProjectDetail>();
  readonly locale = input<Locale>('en');

  protected readonly title = computed(() => this.project().title);
  protected readonly year = computed(() => projectYear(this.project().startDate));
  protected readonly role = computed(() => getLocalized(this.project().role, this.locale()));

  protected readonly descriptionRuns = computed(() => {
    const text = getLocalized(this.project().description, this.locale());
    return parseItalicRuns(text);
  });

  /** Always-on inline "read more" link target — project detail (Case Study) page. */
  protected readonly caseStudyHref = computed(() => `/projects/${this.project().slug}`);

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
