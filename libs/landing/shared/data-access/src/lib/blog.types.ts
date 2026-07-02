import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import type { TranslatableJson } from '@portfolio/shared/types';

export type BlogPostCategory = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostTag = {
  id: string;
  name: string;
  slug: string;
};

export type BlogPostAuthor = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  shortBio: string | null;
};

export type BlogPostListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  language: 'EN' | 'VI';
  featured: boolean;
  featuredImageUrl: string | null;
  categories: BlogPostCategory[];
  tags: BlogPostTag[];
  readTimeMinutes: number | null;
  publishedAt: string | null;
};

export type BlogPostDetail = BlogPostListItem & {
  /** Sanitized rich-text HTML cache (RTE epic Phase 6) — the rendered post body.
   *  Envelope keyed by the post's own `language` (blog posts are single-language).
   *  Null until the post is saved through the console rich-text editor. */
  contentHtml: TranslatableJson | null;
  /** Canonical `PortableDocument` per locale (prose-block renderer epic) — the AST
   *  render source for `<rte-render [doc]>`. Null until the post is (re)saved through
   *  the editor; the detail page falls back to `contentHtml` + `<rte-render-html>`. */
  contentCanonical: TranslatableJson | null;
  /** Resolved media for the `image-ref` blocks in `contentHtml`, keyed by
   *  `data-image-id` (RTE epic Phase 7, task 315). The body is stored URL-free;
   *  the renderer injects `<img>` from this map at read-time. */
  mediaRefs: MediaRefMap;
  metaTitle: string | null;
  metaDescription: string | null;
  author: BlogPostAuthor | null;
  relatedPosts: BlogPostListItem[];
  jsonLd: BlogPostJsonLd;
};

export type BlogPostJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string | null;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: { '@type': 'Person'; name: string; url: string | null };
  publisher: { '@type': 'Person'; name: string };
  mainEntityOfPage: string;
  inLanguage: 'en' | 'vi';
};

export type BlogPostListResponse = {
  data: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
};

export type BlogListSort = 'newest' | 'oldest';

export type BlogListQuery = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  sort?: BlogListSort;
};
