import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContainerComponent, SectionComponent, IconComponent, BadgeComponent } from '@portfolio/landing/shared/ui';
import { ExperienceService } from '@portfolio/landing/shared/data-access';
import { getLocalized } from '@portfolio/shared/utils';
import { DateRangePipe, InitialsPipe } from '@portfolio/shared/ui-pipes';
import type { Locale } from '@portfolio/shared/types';
import type { EmploymentType, LocationType, PublicExperience } from '@portfolio/landing/shared/data-access';

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

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

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

@Component({
  selector: 'landing-feature-experience',
  imports: [
    RouterLink,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    BadgeComponent,
    DateRangePipe,
    InitialsPipe,
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

  getPosition(exp: PublicExperience): string {
    return getLocalized(exp.position, this.locale());
  }

  getDescription(exp: PublicExperience): string {
    return getLocalized(exp.description, this.locale());
  }

  getResponsibilities(exp: PublicExperience): string[] {
    return exp.responsibilities?.[this.locale()] ?? [];
  }

  getHighlights(exp: PublicExperience): string[] {
    return exp.highlights?.[this.locale()] ?? [];
  }

  getTeamRole(exp: PublicExperience): string {
    return getLocalized(exp.teamRole, this.locale());
  }

  getSkillName(name: { en: string; vi: string }): string {
    return getLocalized(name, this.locale());
  }

  getEmploymentLabel(type: EmploymentType): string {
    return EMPLOYMENT_TYPE_LABEL[type] ?? type;
  }

  getLocationLabel(type: LocationType): string {
    return LOCATION_TYPE_LABEL[type] ?? type;
  }

  durationFor(exp: PublicExperience): string {
    return formatDuration(exp.startDate, exp.endDate);
  }
}
