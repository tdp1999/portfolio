export interface TranslatableJson {
  en: string;
  vi: string;
}

export interface TranslatableStringArray {
  en: string[];
  vi: string[];
}

export interface ExperienceSkillDto {
  id: string;
  name: TranslatableJson;
  slug: string;
}

export interface ExperienceLink {
  label: string;
  url: string;
}

export interface AdminExperience {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  companyLogoId: string | null;
  position: TranslatableJson;
  description: TranslatableJson | null;
  responsibilities: TranslatableStringArray;
  highlights: TranslatableStringArray;
  teamRole: TranslatableJson | null;
  links: ExperienceLink[];
  employmentType: string;
  locationType: string;
  locationCountry: string;
  locationCity: string | null;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  clientName: string | null;
  domain: string | null;
  teamSize: number | null;
  startDate: string;
  endDate: string | null;
  skills: ExperienceSkillDto[];
  displayOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExperiencesListResponse {
  data: AdminExperience[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateExperiencePayload {
  companyName: string;
  companyUrl?: string;
  companyLogoId?: string;
  position: TranslatableJson;
  description?: TranslatableJson;
  responsibilities: TranslatableStringArray;
  highlights: TranslatableStringArray;
  teamRole?: TranslatableJson;
  links: ExperienceLink[];
  employmentType: string;
  locationType: string;
  locationCountry?: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  clientName?: string;
  domain?: string;
  teamSize?: number;
  startDate: string;
  endDate?: string;
  skillIds: string[];
  displayOrder: number;
}

export interface UpdateExperiencePayload {
  companyName?: string;
  companyUrl?: string;
  companyLogoId?: string | null;
  position?: TranslatableJson;
  description?: TranslatableJson;
  responsibilities?: TranslatableStringArray;
  highlights?: TranslatableStringArray;
  teamRole?: TranslatableJson;
  links?: ExperienceLink[];
  employmentType?: string;
  locationType?: string;
  locationCountry?: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  clientName?: string;
  domain?: string;
  teamSize?: number;
  startDate?: string;
  endDate?: string | null;
  skillIds?: string[];
  displayOrder?: number;
}

export interface SkillOption {
  id: string;
  name: string;
  slug: string;
}
