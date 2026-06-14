export type SkillTier = 'DAILY' | 'FREQUENT' | 'SHIPPED';

export const SKILL_TIER_OPTIONS: readonly { value: SkillTier; label: string }[] = [
  { value: 'DAILY', label: 'Daily drivers' },
  { value: 'FREQUENT', label: 'Frequent' },
  { value: 'SHIPPED', label: 'Shipped with' },
];

export interface AdminSkill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  isLibrary: boolean;
  parentSkillId: string | null;
  yearsOfExperience: number | null;
  iconId: string | null;
  iconUrl: string | null;
  proficiencyNote: string | null;
  isFeatured: boolean;
  displayOrder: number;
  tier: SkillTier;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SkillsListResponse {
  data: AdminSkill[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSkillPayload {
  name: string;
  category: string;
  description?: string;
  isLibrary?: boolean;
  parentSkillId?: string;
  yearsOfExperience?: number;
  iconId?: string;
  proficiencyNote?: string;
  isFeatured?: boolean;
  displayOrder?: number;
  tier?: SkillTier;
}

export interface ReorderSkillItem {
  id: string;
  displayOrder: number;
}

export type ReorderSkillsPayload = ReorderSkillItem[];

export interface UpdateSkillPayload {
  name?: string;
  category?: string;
  description?: string | null;
  isLibrary?: boolean;
  parentSkillId?: string | null;
  yearsOfExperience?: number | null;
  iconId?: string | null;
  proficiencyNote?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
  tier?: SkillTier;
}
