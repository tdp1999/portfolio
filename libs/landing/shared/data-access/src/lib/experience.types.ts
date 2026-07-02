import type { ExperienceLink, TranslatableJson } from '@portfolio/shared/types';

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
  /** Canonical `PortableDocument` per locale (task 363) — the AST render source for
   *  `<rte-render [doc]>`. Null until the experience is (re)saved through the console
   *  rich-text editor. Supersedes the legacy `description`/`responsibilities`/`highlights`
   *  string columns (dropped in the contract migration). */
  descriptionCanonical: TranslatableJson | null;
  responsibilitiesCanonical: TranslatableJson | null;
  highlightsCanonical: TranslatableJson | null;
  teamRole: TranslatableJson | null;
  links: ExperienceLink[];
  employmentType: EmploymentType;
  locationType: LocationType;
  locationCountry: string;
  locationCity: string | null;
  domain: string | null;
  teamSizeMin: number | null;
  teamSizeMax: number | null;
  startDate: string;
  endDate: string | null;
  skills: PublicExperienceSkill[];
};
