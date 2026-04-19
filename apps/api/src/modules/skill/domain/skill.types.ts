import { IBaseAuditProps } from '@portfolio/shared/types';

export type SkillCategory = 'TECHNICAL' | 'TOOLS' | 'ADDITIONAL';

export interface ISkillProps extends IBaseAuditProps {
  name: string;
  slug: string;
  description: string | null;
  category: SkillCategory;
  isLibrary: boolean;
  parentSkillId: string | null;
  yearsOfExperience: number | null;
  iconUrl: string | null;
  iconId: string | null;
  proficiencyNote: string | null;
  isFeatured: boolean;
  displayOrder: number;
}

export interface ICreateSkillPayload {
  name: string;
  category: SkillCategory;
  description?: string;
  isLibrary?: boolean;
  yearsOfExperience?: number;
  iconId?: string;
  proficiencyNote?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface IUpdateSkillPayload {
  name?: string;
  description?: string | null;
  category?: SkillCategory;
  isLibrary?: boolean;
  yearsOfExperience?: number | null;
  iconId?: string | null;
  proficiencyNote?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
}
