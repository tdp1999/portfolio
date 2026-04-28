import type { ExperienceLink, TranslatableJson, TranslatableStringArray } from '@portfolio/shared/types';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP' | 'SELF_EMPLOYED';
export type LocationType = 'REMOTE' | 'HYBRID' | 'ONSITE';

export type PublicExperienceSkill = {
  id: string;
  name: TranslatableJson;
  slug: string;
};

export type PublicExperience = {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  position: TranslatableJson;
  description: TranslatableJson | null;
  responsibilities: TranslatableStringArray;
  highlights: TranslatableStringArray;
  teamRole: TranslatableJson | null;
  links: ExperienceLink[];
  employmentType: EmploymentType;
  locationType: LocationType;
  locationCountry: string;
  locationCity: string | null;
  domain: string | null;
  teamSize: number | null;
  startDate: string;
  endDate: string | null;
  skills: PublicExperienceSkill[];
};
