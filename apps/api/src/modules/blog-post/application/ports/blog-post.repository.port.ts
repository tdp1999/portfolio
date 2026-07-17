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

/**
 * Minimal projection a bulk action needs to decide eligibility, without pulling
 * whole entities. `hasContent` mirrors the `contentJson != null` half of the
 * `CONTENT_REQUIRED` invariant enforced in `BlogPost.update()`.
 */
export interface BulkPostTarget {
  id: string;
  title: string;
  slug: string;
  hasContent: boolean;
  isDeleted: boolean;
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

  // Bulk writes — single transactional statements; return affected row count.
  // Callers MUST pass an already-vetted id set: these bypass the domain layer, so
  // every invariant `BlogPost` would enforce has to be checked by the handler first
  // (see BulkPostHandler.evaluate).
  bulkSoftDelete(ids: string[], userId: string): Promise<number>;
  bulkRestore(ids: string[], userId: string): Promise<number>;
  bulkPermanentDelete(ids: string[]): Promise<number>;
  bulkSetStatus(ids: string[], status: PostStatus, userId: string): Promise<number>;

  // Bulk preflight reads — feed BulkPostHandler.evaluate.
  findBulkTargets(ids: string[]): Promise<BulkPostTarget[]>;
  /** Subset of `slugs` already held by an ACTIVE post. Mirrors `slugExists` semantics. */
  findTakenSlugs(slugs: string[]): Promise<string[]>;

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
