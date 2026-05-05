import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChipComponent, EyebrowComponent, LandingLinkComponent } from '@portfolio/landing/shared/ui';
import type { ProjectDetail, ProjectHighlight, ProjectLink } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { parseItalicRuns } from './bio-long-runs';

type FallbackLink = { readonly label: string; readonly href: string; readonly external: boolean };
type Decision = { readonly label: string; readonly text: string };

const LINK_LABELS: Record<ProjectLink['type'], string> = {
  repo: 'SOURCE CODE',
  demo: 'LIVE PROJECT',
  'case-study': 'CASE STUDY',
  doc: 'DOCS',
  post: 'WRITE-UP',
};

function toFallbackLink(link: ProjectLink): FallbackLink {
  return {
    label: link.label?.toUpperCase() || LINK_LABELS[link.type],
    href: link.url,
    external: /^https?:\/\//i.test(link.url),
  };
}

@Component({
  selector: 'landing-home-selected-work-fallback',
  standalone: true,
  imports: [ChipComponent, EyebrowComponent, LandingLinkComponent],
  templateUrl: './home-selected-work-fallback.component.html',
  styleUrl: './home-selected-work-fallback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkFallbackComponent {
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

  protected readonly extendedRuns = computed(() => {
    const text = getLocalized(this.project().motivation, this.locale());
    return parseItalicRuns(text);
  });

  protected readonly links = computed<readonly FallbackLink[]>(() => {
    const p = this.project();
    const out: FallbackLink[] = [{ label: 'CASE STUDY', href: `/projects/${p.slug}`, external: false }];
    for (const l of p.links ?? []) out.push(toFallbackLink(l));
    return out;
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
