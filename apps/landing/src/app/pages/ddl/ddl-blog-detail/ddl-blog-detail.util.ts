import type { InPageSection } from '@portfolio/landing/shared/ui';
import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';
import { TOC_MIN_SECTIONS } from './ddl-blog-detail.data';

export function wordCount(content: string | null | undefined): number {
  if (!content) return 0;
  return content.split(/\s+/).filter(Boolean).length;
}

export function shouldHideToc(post: BlogPostDetail | null, sectionCount: number): boolean {
  if (!post) return true;
  const isNote = post.categories.some((c) => c.slug === 'notes');
  return isNote || sectionCount < TOC_MIN_SECTIONS;
}

export function tocFromEntries(entries: readonly { id: string; text: string; level: 2 | 3 }[]): InPageSection[] {
  return entries.map((e) => ({ id: e.id, title: e.text, level: e.level }));
}

/** Chip label for a post: a note, a deep dive (8+ min read, about 1,500+ words), or an essay. */
export function postTypeLabel(post: BlogPostDetail | null): string {
  if (!post) return '—';
  if (post.categories[0]?.slug === 'notes') return 'Note';
  // Deep dive ≈ 1500+ words; read-time is ceil(words / 200), so 1500 words ≈ 8 min.
  if ((post.readTimeMinutes ?? 0) >= 8) return 'Deep dive';
  return 'Essay';
}
