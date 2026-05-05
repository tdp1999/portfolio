import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ChipComponent,
  EyebrowComponent,
  LandingGalleryComponent,
  LandingLinkComponent,
  type GalleryImage,
} from '@portfolio/landing/shared/ui';
import type { ProjectDetail, ProjectLink } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';

type GalleryLink = { readonly label: string; readonly href: string; readonly external: boolean };

const LINK_LABELS: Record<ProjectLink['type'], string> = {
  repo: 'SOURCE CODE',
  demo: 'LIVE PROJECT',
  'case-study': 'CASE STUDY',
  doc: 'DOCS',
  post: 'WRITE-UP',
};

function toGalleryLink(link: ProjectLink): GalleryLink {
  return {
    label: link.label?.toUpperCase() || LINK_LABELS[link.type],
    href: link.url,
    external: /^https?:\/\//i.test(link.url),
  };
}

@Component({
  selector: 'landing-home-selected-work-tab',
  standalone: true,
  imports: [ChipComponent, EyebrowComponent, LandingGalleryComponent, LandingLinkComponent],
  templateUrl: './home-selected-work-tab.component.html',
  styleUrl: './home-selected-work-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkTabComponent {
  readonly project = input.required<ProjectDetail>();
  readonly locale = input<Locale>('en');

  protected readonly title = computed(() => this.project().title);

  protected readonly eyebrow = computed<readonly string[]>(() => {
    const p = this.project();
    const year = p.startDate ? new Date(p.startDate).getFullYear().toString() : '';
    const role = getLocalized(p.role, this.locale());
    return [year, role].filter((part) => part.length > 0);
  });

  protected readonly descriptionRuns = computed(() => {
    const text = getLocalized(this.project().description, this.locale());
    return parseItalicRuns(text);
  });

  protected readonly links = computed<readonly GalleryLink[]>(() => {
    const p = this.project();
    const out: GalleryLink[] = [{ label: 'CASE STUDY', href: `/projects/${p.slug}`, external: false }];
    for (const l of p.links ?? []) out.push(toGalleryLink(l));
    return out;
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
