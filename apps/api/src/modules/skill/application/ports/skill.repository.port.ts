import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillCategory, SkillTier } from '../../domain/skill.types';

export interface SkillFindAllOptions extends PaginatedQuery {
  category?: SkillCategory;
  isLibrary?: boolean;
  parentSkillId?: string | null;
}

export type ISkillRepository = ICrudRepository<Skill> & {
  update(id: string, skill: Skill): Promise<void>;
  remove(id: string, skill: Skill): Promise<void>;
  findBySlug(slug: string): Promise<Skill | null>;
  findByName(name: string): Promise<Skill | null>;
  findByCategory(category: SkillCategory): Promise<Skill[]>;
  findChildren(parentId: string): Promise<Skill[]>;
  hasChildren(skillId: string): Promise<boolean>;
  findAll(options: SkillFindAllOptions): Promise<PaginatedResult<Skill>>;
  findAllNoLimit(): Promise<Skill[]>;
  /**
   * Persists tier + displayOrder for a batch of skills atomically. displayOrder
   * is tier-scoped (0-based within each tier), so consumers must group by tier
   * before sorting by displayOrder — see the landing groupByTier(). Cross-tier
   * moves pass the target tier so the column change persists in the same batch.
   */
  reorder(items: { id: string; displayOrder: number; tier: SkillTier }[]): Promise<void>;
};
