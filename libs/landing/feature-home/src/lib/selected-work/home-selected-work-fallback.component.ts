import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChipComponent, LandingLinkComponent } from '@portfolio/landing/shared/ui';
import type {
  ProjectDetail,
  ProjectHighlight,
  ProjectLink,
  ProjectLinkType,
} from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';

type GroupedLink = { readonly label: string; readonly href: string; readonly external: boolean };
type LinkGroupKey = 'visit' | 'source' | 'read';
type LinkGroup = { readonly key: LinkGroupKey; readonly links: readonly GroupedLink[] };
type Decision = { readonly label: string; readonly text: string };

const LINK_LABELS: Record<ProjectLinkType, string> = {
  repo: 'Source code',
  demo: 'Live project',
  'case-study': 'Case study',
  doc: 'Docs',
  post: 'Write-up',
};

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
  selector: 'landing-home-selected-work-fallback',
  standalone: true,
  imports: [ChipComponent, LandingLinkComponent],
  templateUrl: './home-selected-work-fallback.component.html',
  styleUrl: './home-selected-work-fallback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkFallbackComponent {
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

  protected readonly extendedRuns = computed(() => {
    const text = getLocalized(this.project().motivation, this.locale());
    return parseItalicRuns(text);
  });

  protected readonly caseStudyHref = computed(() => `/projects/${this.project().slug}`);

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

  protected readonly decisions = computed<readonly Decision[]>(() => {
    const highlights: ProjectHighlight[] = this.project().highlights ?? [];
    const out: Decision[] = [];
    for (const h of highlights) {
      const challenge = getLocalized(h.challenge, this.locale());
      const approach = getLocalized(h.approach, this.locale());
      const outcome = getLocalized(h.outcome, this.locale());
      if (challenge) out.push({ label: 'CHALLENGE', text: challenge });
      if (approach) out.push({ label: 'APPROACH', text: approach });
      if (outcome) out.push({ label: 'OUTCOME', text: outcome });
    }
    return out;
  });
}
