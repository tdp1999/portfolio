import type { BlogPostDetail, RenderedMarkdown } from '@portfolio/landing/shared/data-access';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'not-found';

export type DetailState = {
  status: LoadStatus;
  post: BlogPostDetail | null;
  rendered: RenderedMarkdown;
};
