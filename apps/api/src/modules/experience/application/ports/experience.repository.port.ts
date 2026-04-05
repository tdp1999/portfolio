import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Experience } from '../../domain/entities/experience.entity';
import { EmploymentType, LocationType } from '../../domain/experience.types';

export interface ExperienceFindAllOptions extends PaginatedQuery {
  employmentType?: EmploymentType;
  locationType?: LocationType;
  includeDeleted?: boolean;
}

export type IExperienceRepository = Omit<ICrudRepository<Experience>, 'add' | 'findAll'> & {
  add(entity: Experience, skillIds: string[]): Promise<string>;
  update(id: string, entity: Experience, skillIds: string[]): Promise<void>;
  remove(id: string, entity: Experience): Promise<void>;
  restore(id: string, entity: Experience): Promise<void>;
  findById(id: string): Promise<Experience | null>;
  findByIdIncludeDeleted(id: string): Promise<Experience | null>;
  findBySlug(slug: string): Promise<Experience | null>;
  findAll(options: ExperienceFindAllOptions): Promise<PaginatedResult<Experience>>;
  findAllPublic(): Promise<Experience[]>;
  slugExists(slug: string): Promise<boolean>;
  reorder(items: { id: string; displayOrder: number }[]): Promise<void>;
};
