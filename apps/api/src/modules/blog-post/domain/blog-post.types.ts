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
  // Rich-text storage for the post body. JSON canonical + sanitized HTML cache
  // ({ en, vi } envelope); the legacy plain-markdown `content` column was dropped
  // in task 363 — the rich triple + canonical are the sole body source.
  contentJson: TranslatableRichText | null;
  contentHtml: TranslatableJson | null;
  contentSchemaVersion: number;
  // Canonical PortableDocument per locale (prose-block renderer epic, D3 adapter) —
  // the AST renderer's read source. Derived from `contentJson` at write-time; null
  // until the next save populates it.
  contentCanonical: TranslatableJson | null;
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
  language?: 'EN' | 'VI';
  status?: PostStatus;
  featured?: boolean;
  /** PST-011: explicit `null` is rejected; `undefined` means "no change". */
  featuredImageId?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  publishedAt?: Date | null;
}
