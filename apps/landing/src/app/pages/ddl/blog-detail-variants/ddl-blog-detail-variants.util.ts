import type { InPageSection } from '@portfolio/landing/shared/ui';
import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';
import { TOC_MIN_SECTIONS } from './ddl-blog-detail-variants.data';

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
