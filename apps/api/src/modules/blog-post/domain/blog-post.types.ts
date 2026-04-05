import { IBaseAuditProps } from '@portfolio/shared/types';

export const POST_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PRIVATE: 'PRIVATE',
  UNLISTED: 'UNLISTED',
} as const;

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS];

export interface IBlogPostProps extends IBaseAuditProps {
  slug: string;
  language: 'EN' | 'VI';

  // Content
  title: string;
  excerpt: string | null;
  content: string;
  readTimeMinutes: number | null;

  // Status & Display
  status: PostStatus;
  featured: boolean;
  publishedAt: Date | null;

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;

  // Relations
  authorId: string;
  featuredImageId: string | null;
}

export interface ICreateBlogPostPayload {
  title: string;
  content: string;
  language?: 'EN' | 'VI';
  excerpt?: string;
  featured?: boolean;
  authorId: string;
  featuredImageId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface IUpdateBlogPostPayload {
  title?: string;
  excerpt?: string | null;
  content?: string;
  language?: 'EN' | 'VI';
  status?: PostStatus;
  featured?: boolean;
  featuredImageId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | null;
}
