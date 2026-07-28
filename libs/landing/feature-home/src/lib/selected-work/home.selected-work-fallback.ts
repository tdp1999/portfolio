import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chip, Link, LandingCopyPipe, resolveCopy } from '@portfolio/landing/shared/ui';
import type { ProjectDetailData, ProjectHighlight } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { Locale } from '@portfolio/shared/types';
import { parseInlineRuns } from '@portfolio/landing/shared/util';
import { buildLinkGroups, projectYear, type LinkGroup } from './selected-work-shared';
import type { Decision } from './home.selected-work-fallback.types';

@Component({
  selector: 'landing-home-selected-work-fallback',
  standalone: true,
  imports: [Chip, Link, LandingCopyPipe],
  templateUrl: './home.selected-work-fallback.html',
  styleUrl: './home.selected-work-fallback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeSelectedWorkFallback {
  readonly project = input.required<ProjectDetailData>();
  readonly locale = input<Locale>('en');

  protected readonly title = computed(() => this.project().title);
  protected readonly year = computed(() => projectYear(this.project().startDate));
  protected readonly role = computed(() => getLocalized(this.project().role, this.locale()));

  protected readonly descriptionRuns = computed(() => {
    const text = getLocalized(this.project().description, this.locale());
    return parseInlineRuns(text);
  });

  protected readonly extendedRuns = computed(() => {
    const text = getLocalized(this.project().motivation, this.locale());
    return parseInlineRuns(text);
  });

  protected readonly caseStudyHref = computed(() => `/projects/${this.project().slug}`);

  protected readonly linkGroups = computed<readonly LinkGroup[]>(() =>
    buildLinkGroups(this.project().links, this.locale())
  );

  protected readonly skills = computed(() => this.project().skills);

  protected readonly decisions = computed<readonly Decision[]>(() => {
    const locale = this.locale();
    const highlights: ProjectHighlight[] = this.project().highlights ?? [];
    const out: Decision[] = [];
    for (const h of highlights) {
      const challenge = getLocalized(h.challenge, locale);
      const approach = getLocalized(h.approach, locale);
      const outcome = getLocalized(h.outcome, locale);
      if (challenge) out.push({ label: resolveCopy('home.selectedWork.decision.challenge', locale), text: challenge });
      if (approach) out.push({ label: resolveCopy('home.selectedWork.decision.approach', locale), text: approach });
      if (outcome) out.push({ label: resolveCopy('home.selectedWork.decision.outcome', locale), text: outcome });
    }
    return out;
  });
}
