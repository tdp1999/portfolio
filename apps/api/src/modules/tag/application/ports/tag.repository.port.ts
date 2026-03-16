import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Tag } from '../../domain/entities/tag.entity';

export interface TagFindAllOptions extends PaginatedQuery {
  // Tag-specific filters can be added here
}

export type ITagRepository = ICrudRepository<Tag> & {
  update(id: string, tag: Tag): Promise<void>;
  remove(id: string, tag: Tag): Promise<void>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findAll(options: TagFindAllOptions): Promise<PaginatedResult<Tag>>;
};
