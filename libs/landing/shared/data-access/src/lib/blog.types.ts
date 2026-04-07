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
};

export type BlogPostListResponse = {
  data: BlogPostListItem[];
  total: number;
  page: number;
  limit: number;
};

export type BlogListQuery = {
  page?: number;
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
};
