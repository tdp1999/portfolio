import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';
import type { TocEntry } from '@portfolio/landing/shared/util';

export type Tab = 'v4' | 'v1' | 'v2' | 'v3' | 'prototypes' | 'usage';

export type LoadedPost = {
  post: BlogPostDetail | null;
  html: string;
  toc: readonly TocEntry[];
};
