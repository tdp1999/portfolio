import { z } from 'zod/v4';
import { stripHtmlTags, nonEmptyPartial, PaginatedQuerySchema } from '@portfolio/shared/utils';
import { POST_STATUS } from '../domain/blog-post.types';

const TitleSchema = z
  .string()
  .min(1)
  .max(200)
  .transform((v) => stripHtmlTags(v.trim()));

const ContentSchema = z.string().min(1);

const ExcerptSchema = z
  .string()
  .max(500)
  .transform((v) => stripHtmlTags(v.trim()));

const MetaTitleSchema = z
  .string()
  .max(200)
  .transform((v) => stripHtmlTags(v.trim()));

const MetaDescriptionSchema = z
  .string()
  .max(500)
  .transform((v) => stripHtmlTags(v.trim()));

const LanguageSchema = z.enum(['EN', 'VI']);

const PostStatusSchema = z.enum([POST_STATUS.DRAFT, POST_STATUS.PUBLISHED, POST_STATUS.PRIVATE, POST_STATUS.UNLISTED]);

// --- Create ---

export const CreateBlogPostSchema = z.object({
  title: TitleSchema,
  content: ContentSchema,
  language: LanguageSchema.default('EN'),
  excerpt: ExcerptSchema.optional(),
  categoryIds: z.array(z.uuid()).default([]),
  tagIds: z.array(z.uuid()).default([]),
  featuredImageId: z.uuid().nullable().optional(),
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
  language: LanguageSchema,
  excerpt: ExcerptSchema.nullable(),
  categoryIds: z.array(z.uuid()),
  tagIds: z.array(z.uuid()),
  featuredImageId: z.uuid().nullable(),
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

export const PublicBlogPostQuerySchema = PaginatedQuerySchema.extend({
  language: LanguageSchema.optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
});

export type PublicBlogPostQueryDto = z.infer<typeof PublicBlogPostQuerySchema>;

// --- Import Markdown ---

export const ImportMarkdownSchema = z.object({
  title: TitleSchema.optional(),
  content: ContentSchema,
  language: LanguageSchema.default('EN'),
});

export type ImportMarkdownDto = z.infer<typeof ImportMarkdownSchema>;

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
  featuredImageUrl: string | null;
  categories: BlogPostCategoryResponseDto[];
  tags: BlogPostTagResponseDto[];
  readTimeMinutes: number | null;
  publishedAt: Date | null;
};

export type BlogPostPublicDetailDto = BlogPostPublicListItemDto & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  author: BlogPostAuthorDto | null;
  relatedPosts: BlogPostPublicListItemDto[];
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
  readTimeMinutes: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string;
  featuredImageId: string | null;
  createdById: string;
  updatedById: string;
  deletedById: string | null;
};
