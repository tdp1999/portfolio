import { PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { BlogPostReadResult } from '../../infrastructure/mapper/blog-post.mapper';
import { PostStatus } from '../../domain/blog-post.types';

export interface BlogPostCreateInput {
  entity: BlogPost;
  categoryIds: string[];
  tagIds: string[];
}

export interface BlogPostUpdateInput {
  entity: BlogPost;
  categoryIds: string[];
  tagIds: string[];
}

export interface BlogPostFindAllOptions extends PaginatedQuery {
  status?: PostStatus;
  language?: 'EN' | 'VI';
  sortBy?: string;
}

export type BlogPostPublicSort = 'newest' | 'oldest';

export interface BlogPostListPublicOptions extends PaginatedQuery {
  categoryId?: string;
  tagId?: string;
  language?: 'EN' | 'VI';
  /**
   * Free-text search across `title` + `excerpt` (case-insensitive contains).
   * Caller is expected to trim; empty string is treated as no search.
   */
  search?: string;
  /**
   * `'newest'` (default) → publishedAt DESC, `'oldest'` → publishedAt ASC.
   * Extend as the union grows (e.g. `'mostRead'`) — keep as TS literal union
   * so typos break at compile time.
   */
  sortBy?: BlogPostPublicSort;
}

export interface IBlogPostRepository {
  // Write
  add(input: BlogPostCreateInput): Promise<string>;
  update(id: string, input: BlogPostUpdateInput): Promise<void>;
  softDelete(id: string, entity: BlogPost): Promise<void>;
  restore(id: string, entity: BlogPost): Promise<void>;

  // Admin reads
  findById(id: string): Promise<BlogPostReadResult | null>;
  findByIdIncludeDeleted(id: string): Promise<BlogPostReadResult | null>;
  list(options: BlogPostFindAllOptions): Promise<PaginatedResult<BlogPostReadResult>>;

  // Public reads
  findBySlug(slug: string): Promise<BlogPostReadResult | null>;
  listPublic(options: BlogPostListPublicOptions): Promise<PaginatedResult<BlogPostReadResult>>;
  listFeatured(): Promise<BlogPostReadResult[]>;
  /**
   * PST-010: Related posts by primary-category match only. Excludes self,
   * filters to PUBLISHED + active rows, orders by publishedAt DESC, limit N.
   * Caller must resolve the primary category (none → return [] without calling).
   */
  findRelatedByPrimaryCategory(
    excludeId: string,
    primaryCategoryId: string,
    limit: number
  ): Promise<BlogPostReadResult[]>;

  // Utility
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
