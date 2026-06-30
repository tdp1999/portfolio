import { z } from 'zod/v4';
import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import type { TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { ExcerptSchema, MetaDescriptionSchema, MetaTitleSchema, TitleSchema } from '@portfolio/shared/validation/zod';
import { POST_STATUS } from '../domain/blog-post.types';
// Import the schema file directly (not the barrel) so the zod schema doesn't pull
// in RichTextService → ESM document-engine-core, which breaks node-env specs.
import { EditorDocumentSchema } from '../../shared/rich-text/rich-text.schema';

const ContentSchema = z.string().min(1);

const LanguageSchema = z.enum(['EN', 'VI']);

const PostStatusSchema = z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED, POST_STATUS.PRIVATE, POST_STATUS.UNLISTED]);

// --- Create ---

export const CreateBlogPostSchema = z.object({
  title: TitleSchema,
  content: ContentSchema,
  // Single editor document (a post is one language). The handler wraps it into
  // the bilingual `{ [language]: doc }` storage envelope. Legacy `content`
  // (plain text) stays populated for the transition until the landing render swap.
  contentJson: EditorDocumentSchema.optional(),
  language: LanguageSchema.default('EN'),
  excerpt: ExcerptSchema.optional(),
  categoryIds: z.array(z.uuid()).default([]),
  tagIds: z.array(z.uuid()).default([]),
  featuredImageId: z.uuid(),
  status: PostStatusSchema.default(POST_STATUS.DRAFT),
  featured: z.boolean().default(false),
  metaTitle: MetaTitleSchema.optional(),
  metaDescription: MetaDescriptionSchema.optional(),
});

export type CreateBlogPostDto = z.infer<typeof CreateBlogPostSchema>;

// --- Update ---

const UpdateBlogPostBaseSchema = z.object({
  title: TitleSchema,
  content: ContentSchema,
  contentJson: EditorDocumentSchema.optional(),
  language: LanguageSchema,
  excerpt: ExcerptSchema.nullable(),
  categoryIds: z.array(z.uuid()),
  tagIds: z.array(z.uuid()),
  featuredImageId: z.uuid(),
  status: PostStatusSchema,
  featured: z.boolean(),
  metaTitle: MetaTitleSchema.nullable(),
  metaDescription: MetaDescriptionSchema.nullable(),
});

export const UpdateBlogPostSchema = nonEmptyPartial(UpdateBlogPostBaseSchema);

export type UpdateBlogPostDto = z.infer<typeof UpdateBlogPostSchema>;

// --- Query (admin) ---

export const BlogPostQuerySchema = PaginatedQuerySchema.extend({
  status: PostStatusSchema.optional(),
  language: LanguageSchema.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'publishedAt', 'createdAt', 'title']).default('updatedAt'),
  includeDeleted: z.coerce.boolean().default(false),
});

export type BlogPostQueryDto = z.infer<typeof BlogPostQuerySchema>;

// --- Query (public) ---

export const PUBLIC_BLOG_SORT = ['newest', 'oldest'] as const;
export type PublicBlogSort = (typeof PUBLIC_BLOG_SORT)[number];

export const PublicBlogPostQuerySchema = PaginatedQuerySchema.extend({
  language: LanguageSchema.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
  // Free-text against title + excerpt. Trim whitespace; empty → no search.
  search: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? undefined : v))
    .optional(),
  // URL param `?sort=newest|oldest`. Default 'newest' (not serialized to URL).
  sort: z.enum(PUBLIC_BLOG_SORT).default('newest'),
});

export type PublicBlogPostQueryDto = z.infer<typeof PublicBlogPostQuerySchema>;

// --- Convert Markdown ---
// Stateless transform: Obsidian/Markdown → editor JSON for the console to prefill
// the editor. It does NOT create a post — the author reviews and Saves through the
// normal create flow (cover, validation, persistence happen there). So no
// `featuredImageId`/`status` here.

export const ConvertMarkdownSchema = z.object({
  content: ContentSchema,
  title: TitleSchema.optional(),
});

export type ConvertMarkdownDto = z.infer<typeof ConvertMarkdownSchema>;

export type ConvertMarkdownResultDto = {
  /** H1 (or explicit) title, for prefilling the title field. */
  title: string;
  /** Converted editor document, for prefilling the body editor. */
  contentJson: EditorDocument;
  /** Non-fatal conversion notes (e.g. images that must be re-inserted). */
  warnings: string[];
};

// --- Response shapes ---

export type BlogPostCategoryResponseDto = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostTagResponseDto = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostAuthorDto = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  shortBio: string | null;
};

export type BlogPostPublicListItemDto = {
  slug: string;
  title: string;
  excerpt: string | null;
  language: 'EN' | 'VI';
  featured: boolean;
  featuredImageUrl: string | null;
  categories: BlogPostCategoryResponseDto[];
  tags: BlogPostTagResponseDto[];
  readTimeMinutes: number | null;
  publishedAt: Date | null;
};

export type BlogPostPublicDetailDto = BlogPostPublicListItemDto & {
  content: string;
  /** Rich-text storage for `content` (RTE epic Phase 2). Null until Phase 4. */
  contentJson: TranslatableRichText | null;
  contentHtml: TranslatableJson | null;
  contentSchemaVersion: number;
  /** Resolved media for the `image-ref` blocks in `contentHtml`, keyed by
   *  `data-image-id` (RTE epic Phase 7, task 315). Empty when the body references
   *  no media. The landing renderer injects `<img>` from this at read-time. */
  mediaRefs: MediaRefMap;
  metaTitle: string | null;
  metaDescription: string | null;
  author: BlogPostAuthorDto | null;
  relatedPosts: BlogPostPublicListItemDto[];
  jsonLd: BlogPostJsonLdDto;
};

// schema.org BlogPosting (subclass of Article). `image` is omitted (not null) when
// the post has no featured image, per Google's structured-data validator preference.
export type BlogPostJsonLdDto = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string | null;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
    url: string | null;
  };
  publisher: {
    '@type': 'Person';
    name: string;
  };
  mainEntityOfPage: string;
  inLanguage: 'en' | 'vi';
};

export type BlogPostAdminListItemDto = {
  id: string;
  slug: string;
  title: string;
  language: 'EN' | 'VI';
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  categories: BlogPostCategoryResponseDto[];
  tags: BlogPostTagResponseDto[];
  featuredImageUrl: string | null;
};

export type BlogPostAdminDetailDto = BlogPostAdminListItemDto & {
  excerpt: string | null;
  content: string;
  /** Rich-text storage for `content` (RTE epic Phase 2). Null until Phase 4. */
  contentJson: TranslatableRichText | null;
  contentHtml: TranslatableJson | null;
  contentSchemaVersion: number;
  readTimeMinutes: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string;
  featuredImageId: string;
  createdById: string;
  updatedById: string;
  deletedById: string | null;
};
