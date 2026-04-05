import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Skill } from '../../domain/entities/skill.entity';
import { SkillCategory } from '../../domain/skill.types';

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
};
