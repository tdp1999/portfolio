import type { BlogPostDetail, RenderedMarkdown } from '@portfolio/landing/shared/data-access';

export type Tab = 'v4' | 'v1' | 'v2' | 'v3' | 'prototypes' | 'usage';

export type LoadedPost = {
  post: BlogPostDetail | null;
  rendered: RenderedMarkdown;
};
