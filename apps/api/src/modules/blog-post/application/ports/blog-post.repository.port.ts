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

export interface BlogPostListPublicOptions extends PaginatedQuery {
  categoryId?: string;
  tagId?: string;
  language?: 'EN' | 'VI';
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
  findRelated(postId: string, categoryIds: string[], tagIds: string[], limit: number): Promise<BlogPostReadResult[]>;

  // Utility
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
}
