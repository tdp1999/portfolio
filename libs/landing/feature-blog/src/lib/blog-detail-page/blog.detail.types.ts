import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'not-found';

export type DetailState = {
  status: LoadStatus;
  post: BlogPostDetail | null;
};
