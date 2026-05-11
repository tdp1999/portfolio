import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ChipComponent,
  LandingGalleryComponent,
  LandingLinkComponent,
  type GalleryImage,
} from '@portfolio/landing/shared/ui';
import type { ProjectDetail, ProjectLink, ProjectLinkType } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';

type GroupedLink = { readonly label: string; readonly href: string; readonly external: boolean };
type LinkGroupKey = 'visit' | 'source' | 'read';
type LinkGroup = { readonly key: LinkGroupKey; readonly links: readonly GroupedLink[] };

const LINK_LABELS: Record<ProjectLinkType, string> = {
  repo: 'Source code',
  demo: 'Live project',
  'case-study': 'Case study',
  doc: 'Docs',
  post: 'Write-up',
};

/** Maps each link type to its semantic group. `case-study` is rendered inline as a "read more" link inside the description, not in the grouped list. */
const LINK_GROUP: Record<Exclude<ProjectLinkType, 'case-study'>, LinkGroupKey> = {
  demo: 'visit',
  repo: 'source',
  doc: 'read',
  post: 'read',
};

const GROUP_ORDER: readonly LinkGroupKey[] = ['visit', 'source', 'read'];

function toGroupedLink(link: ProjectLink): GroupedLink {
  return {
    label: link.label || LINK_LABELS[link.type],
    href: link.url,
    external: /^https?:\/\//i.test(link.url),
  };
}

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

  protected readonly year = computed(() => {
    const start = this.project().startDate;
    return start ? new Date(start).getFullYear().toString() : '';
  });

  protected readonly role = computed(() => getLocalized(this.project().role, this.locale()));

  protected readonly descriptionRuns = computed(() => {
    const text = getLocalized(this.project().description, this.locale());
    return parseItalicRuns(text);
  });

  /** Always-on inline "read more" link target — project detail (Case Study) page. */
  protected readonly caseStudyHref = computed(() => `/projects/${this.project().slug}`);

  /** Project-author-supplied links, grouped by purpose. `case-study` typed links from the API are surfaced inline rather than in groups. */
  protected readonly linkGroups = computed<readonly LinkGroup[]>(() => {
    const buckets: Record<LinkGroupKey, GroupedLink[]> = { visit: [], source: [], read: [] };
    for (const l of this.project().links ?? []) {
      if (l.type === 'case-study') continue;
      const key = LINK_GROUP[l.type];
      buckets[key].push(toGroupedLink(l));
    }
    return GROUP_ORDER.map((key) => ({ key, links: buckets[key] })).filter((g) => g.links.length > 0);
  });

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
