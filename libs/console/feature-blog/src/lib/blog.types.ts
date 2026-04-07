export type BlogLanguage = 'EN' | 'VI';
export type BlogStatus = 'DRAFT' | 'PUBLISHED' | 'PRIVATE' | 'UNLISTED';

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
  content: string;
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
  content: string;
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
  content?: string;
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

export interface ImportMarkdownPayload {
  title?: string;
  content: string;
  language?: BlogLanguage;
}
