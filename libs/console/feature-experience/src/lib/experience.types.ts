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

export interface AdminExperience {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  companyLogoId: string | null;
  position: TranslatableJson;
  description: TranslatableJson | null;
  achievements: TranslatableStringArray;
  teamRole: TranslatableJson | null;
  employmentType: string;
  locationType: string;
  locationCountry: string;
  locationCity: string | null;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  clientName: string | null;
  clientIndustry: string | null;
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
  achievements: TranslatableStringArray;
  teamRole?: TranslatableJson;
  employmentType: string;
  locationType: string;
  locationCountry?: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  clientName?: string;
  clientIndustry?: string;
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
  achievements?: TranslatableStringArray;
  teamRole?: TranslatableJson;
  employmentType?: string;
  locationType?: string;
  locationCountry?: string;
  locationCity?: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  clientName?: string;
  clientIndustry?: string;
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
