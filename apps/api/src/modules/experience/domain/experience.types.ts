import { IBaseAuditProps, TranslatableJson, TranslatableStringArray } from '@portfolio/shared/types';

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
  achievements: TranslatableStringArray;
  teamRole: TranslatableJson | null;

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
  clientIndustry: string | null;
  domain: string | null;
  teamSize: number | null;

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
  achievements?: TranslatableStringArray;
  teamRole?: TranslatableJson;

  employmentType?: EmploymentType;
  locationType?: LocationType;

  locationCountry: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;

  clientName?: string;
  clientIndustry?: string;
  domain?: string;
  teamSize?: number;

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
  achievements?: TranslatableStringArray;
  teamRole?: TranslatableJson | null;

  employmentType?: EmploymentType;
  locationType?: LocationType;

  locationCountry?: string;
  locationCity?: string | null;
  locationPostalCode?: string | null;
  locationAddress1?: string | null;
  locationAddress2?: string | null;

  clientName?: string | null;
  clientIndustry?: string | null;
  domain?: string | null;
  teamSize?: number | null;

  startDate?: Date;
  endDate?: Date | null;

  displayOrder?: number;
}
