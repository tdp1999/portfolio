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
  content: string;
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
