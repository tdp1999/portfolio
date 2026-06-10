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
