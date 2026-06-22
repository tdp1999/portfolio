import { IBaseAuditProps, TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';

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
  // Rich-text storage for `content` (RTE epic Phase 2, expand phase). JSON canonical +
  // sanitized HTML cache ({ en, vi } envelope per the 2026-06-10 uniform-scope decision);
  // null until Phase 4 RichTextService populates them. Old markdown `content` kept.
  contentJson: TranslatableRichText | null;
  contentHtml: TranslatableJson | null;
  contentSchemaVersion: number;
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
  featuredImageId: string;
}

export interface ICreateBlogPostPayload {
  title: string;
  content: string;
  language?: 'EN' | 'VI';
  excerpt?: string;
  featured?: boolean;
  authorId: string;
  /** PST-011: required at all times — null/undefined rejected by entity. */
  featuredImageId: string;
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
  /** PST-011: explicit `null` is rejected; `undefined` means "no change". */
  featuredImageId?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | null;
}
