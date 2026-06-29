import type { ProjectListItem } from '@portfolio/landing/shared/data-access';
import type { ProjectIndexEntry } from './project.detail.types';

export function sortedIndex(list: readonly ProjectListItem[]): readonly ProjectIndexEntry[] {
  return [...list]
    .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0))
    .map((p) => ({ slug: p.slug, title: p.title }));
}

export function yearRange(start: string, end: string | null): string {
  const s = new Date(start).getFullYear();
  const e = end ? new Date(end).getFullYear() : null;
  if (!Number.isFinite(s)) return '—';
  if (e === null) return `${s} → Present`;
  return s === e ? String(s) : `${s} → ${e}`;
}

export function zero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Fallback wrapper for a highlight sub-field while data is mid-migration: a
 * highlight whose `*Html` cache isn't populated yet still has legacy plain text
 * in `challenge`/`approach`/`outcome`. Wrap it as an escaped `<p>` so the same
 * `<rte-render-html>` path renders it (its sanitize pass keeps the escaped text
 * intact). Returns `''` for empty input so the block collapses cleanly.
 */
export function plainToHtml(text: string): string {
  if (!text) return '';
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<p>${escaped}</p>`;
}
