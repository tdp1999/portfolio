import type { BilingualEditorDocument } from '@portfolio/console/shared/util';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

export type BlogLanguage = 'EN' | 'VI';
export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'PRIVATE' | 'UNLISTED';

export interface ListBlogPostsParams {
  page: number;
  limit: number;
  status?: BlogStatus;
  language?: BlogLanguage;
  includeDeleted?: boolean;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface BlogCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface BlogTagRef {
  id: string;
  name: string;
  slug: string;
}

export interface AdminBlogPostListItem {
  id: string;
  slug: string;
  title: string;
  language: BlogLanguage;
  status: BlogStatus;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  categories: BlogCategoryRef[];
  tags: BlogTagRef[];
  featuredImageUrl: string | null;
}

export interface AdminBlogPostDetail extends AdminBlogPostListItem {
  excerpt: string | null;
  /**
   * Rich-text body — the bilingual `{ en, vi }` envelope (one locale populated,
   * keyed by `language`). The form extracts the active-language document to hydrate
   * the editor. Legacy plain `content` was dropped in task 363.
   */
  contentJson: BilingualEditorDocument | null;
  /** Sanitized rich-text HTML cache ({ en, vi }); the admin detail read-view renders
   *  it via `<rte-render-html>`. Null until the post is authored through the editor. */
  contentHtml: { en: string; vi: string } | null;
  readTimeMinutes: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string;
  featuredImageId: string | null;
  createdById: string;
  updatedById: string;
  deletedById: string | null;
}

export interface BlogPostListResponse {
  data: AdminBlogPostListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateBlogPostPayload {
  title: string;
  /** Single editor document (the sole body source); the BE wraps it into the
   *  `{ [language]: doc }` envelope and canonicalizes it. Required by the BE + the
   *  form's richTextRequiredValidator; optional here only to avoid null-narrowing noise. */
  contentJson?: EditorDocument;
  language: BlogLanguage;
  excerpt?: string;
  categoryIds?: string[];
  tagIds?: string[];
  featuredImageId?: string | null;
  status?: BlogStatus;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateBlogPostPayload {
  title?: string;
  /** Single editor document; the BE wraps it into the `{ [language]: doc }` envelope. */
  contentJson?: EditorDocument;
  language?: BlogLanguage;
  excerpt?: string | null;
  categoryIds?: string[];
  tagIds?: string[];
  featuredImageId?: string | null;
  status?: BlogStatus;
  featured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface ConvertMarkdownPayload {
  content: string;
  title?: string;
}

export interface ConvertMarkdownResult {
  title: string;
  contentJson: EditorDocument;
  warnings: string[];
}
