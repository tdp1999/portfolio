import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Category } from '../../domain/entities/category.entity';

export interface CategoryFindAllOptions extends PaginatedQuery {
  // Category-specific filters can be added here
}

export type ICategoryRepository = ICrudRepository<Category> & {
  update(id: string, category: Category): Promise<void>;
  remove(id: string, category: Category): Promise<void>;
  findBySlug(slug: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(options: CategoryFindAllOptions): Promise<PaginatedResult<Category>>;
};
