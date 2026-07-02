import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';

export function shouldHideToc(post: BlogPostDetail | null, sectionCount: number): boolean {
  if (!post) return true;
  const isNote = post.categories.some((c) => c.slug === 'notes');
  return isNote || sectionCount < 3;
}
