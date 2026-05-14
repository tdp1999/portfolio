import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import type { EmploymentType, LocationType, PublicExperience } from '@portfolio/landing/shared/data-access';
import { ExperienceService } from '@portfolio/landing/shared/data-access';
import {
  ChipComponent,
  ContainerComponent,
  IconComponent,
  LandingBackLinkComponent,
  LandingEmptyStateComponent,
  SectionComponent,
} from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';
import { DateRangePipe, InitialsPipe } from '@portfolio/shared/ui/pipes';
import { getLocalized } from '@portfolio/shared/utils';

const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship',
  SELF_EMPLOYED: 'Self-employed',
};

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

function diffMonths(startStr: string, endStr: string | null): number {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : new Date();
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function formatDuration(startStr: string, endStr: string | null): string {
  const totalMonths = Math.max(0, diffMonths(startStr, endStr));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return `${years} yr ${months} mo`;
  if (years > 0) return `${years} yr`;
  return `${months} mo`;
}

type ExperienceVm = PublicExperience & {
  displayPosition: string;
  displayDescription: string;
  displayResponsibilities: string[];
  displayHighlights: string[];
  displayTeamRole: string;
  displayDuration: string;
  employmentLabel: string;
  locationLabel: string;
  skillNames: { id: string; name: string }[];
};

@Component({
  selector: 'landing-feature-experience',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    SectionComponent,
    IconComponent,
    ChipComponent,
    DateRangePipe,
    InitialsPipe,
    LandingBackLinkComponent,
    LandingEmptyStateComponent,
  ],
  templateUrl: './feature-experience.html',
  styleUrl: './feature-experience.scss',
})
export class FeatureExperience {
  private experienceService = inject(ExperienceService);
  private title = inject(Title);
  private meta = inject(Meta);

  constructor() {
    this.title.setTitle('Career History | Portfolio');
    this.meta.updateTag({
      name: 'description',
      content: 'Professional experience and career timeline — positions, companies, and technologies.',
    });
  }

  locale = signal<Locale>('en');
  experiences = toSignal(this.experienceService.getPublicExperiences(), { initialValue: [] });

  experienceVms = computed<ExperienceVm[]>(() => {
    const lang = this.locale();
    return this.experiences().map((exp) => ({
      ...exp,
      displayPosition: getLocalized(exp.position, lang),
      displayDescription: getLocalized(exp.description, lang),
      displayResponsibilities: exp.responsibilities?.[lang] ?? [],
      displayHighlights: exp.highlights?.[lang] ?? [],
      displayTeamRole: getLocalized(exp.teamRole, lang),
      displayDuration: formatDuration(exp.startDate, exp.endDate),
      employmentLabel: EMPLOYMENT_TYPE_LABEL[exp.employmentType] ?? exp.employmentType,
      locationLabel: LOCATION_TYPE_LABEL[exp.locationType] ?? exp.locationType,
      skillNames: exp.skills.map((s) => ({ id: s.id, name: getLocalized(s.name, lang) })),
    }));
  });

  hideBrokenImage(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLElement) target.style.display = 'none';
  }
}
