import {
  ExperienceLink,
  IBaseAuditProps,
  TranslatableJson,
  TranslatableRichText,
  TranslatableStringArray,
} from '@portfolio/shared/types';

export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  FREELANCE: 'FREELANCE',
  INTERNSHIP: 'INTERNSHIP',
  SELF_EMPLOYED: 'SELF_EMPLOYED',
} as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPE)[keyof typeof EMPLOYMENT_TYPE];

export const LOCATION_TYPE = {
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
  ONSITE: 'ONSITE',
} as const;

export type LocationType = (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE];

export interface IExperienceProps extends IBaseAuditProps {
  // Identity
  slug: string;

  // Company
  companyName: string;
  companyUrl: string | null;
  companyLogoId: string | null;

  // Translatable
  position: TranslatableJson;
  description: TranslatableJson | null;
  responsibilities: TranslatableStringArray;
  highlights: TranslatableStringArray;
  teamRole: TranslatableJson | null;

  // Rich-text storage (RTE epic Phase 2, expand phase) — 3 cols per prose sub-field.
  // JSON canonical + sanitized HTML cache ({ en, vi } envelope); null until Phase 4
  // RichTextService populates them. Old `description`/`responsibilities`/`highlights`
  // columns kept side-by-side until task 363 drop.
  descriptionJson: TranslatableRichText | null;
  descriptionHtml: TranslatableJson | null;
  descriptionSchemaVersion: number;
  responsibilitiesJson: TranslatableRichText | null;
  responsibilitiesHtml: TranslatableJson | null;
  responsibilitiesSchemaVersion: number;
  highlightsJson: TranslatableRichText | null;
  highlightsHtml: TranslatableJson | null;
  highlightsSchemaVersion: number;

  // Links (non-translatable)
  links: ExperienceLink[];

  // Employment
  employmentType: EmploymentType;
  locationType: LocationType;

  // Location
  locationCountry: string;
  locationCity: string | null;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;

  // Client context
  clientName: string | null;
  domain: string | null;
  teamSizeMin: number | null;
  teamSizeMax: number | null;

  // Dates
  startDate: Date;
  endDate: Date | null;

  // Display
  displayOrder: number;

  // Relations
  skillIds: string[];
}

export interface ICreateExperiencePayload {
  companyName: string;
  companyUrl?: string;
  companyLogoId?: string;

  position: TranslatableJson;
  description?: TranslatableJson;
  responsibilities?: TranslatableStringArray;
  highlights?: TranslatableStringArray;
  teamRole?: TranslatableJson;

  links?: ExperienceLink[];

  employmentType?: EmploymentType;
  locationType?: LocationType;

  locationCountry: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;

  clientName?: string;
  domain?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;

  startDate: Date;
  endDate?: Date;

  displayOrder?: number;
}

export interface IUpdateExperiencePayload {
  companyName?: string;
  companyUrl?: string | null;
  companyLogoId?: string | null;

  position?: TranslatableJson;
  description?: TranslatableJson | null;
  responsibilities?: TranslatableStringArray;
  highlights?: TranslatableStringArray;
  teamRole?: TranslatableJson | null;

  links?: ExperienceLink[];

  employmentType?: EmploymentType;
  locationType?: LocationType;

  locationCountry?: string;
  locationCity?: string | null;
  locationPostalCode?: string | null;
  locationAddress1?: string | null;
  locationAddress2?: string | null;

  clientName?: string | null;
  domain?: string | null;
  teamSizeMin?: number | null;
  teamSizeMax?: number | null;

  startDate?: Date;
  endDate?: Date | null;

  displayOrder?: number;
}
