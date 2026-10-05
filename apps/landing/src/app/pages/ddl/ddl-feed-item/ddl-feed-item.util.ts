import type { ProjectListItem } from '@portfolio/landing/shared/data-access';

export function yearOf(iso: string): string {
  return String(new Date(iso).getFullYear());
}

export function yearRange(start: string, end: string | null): string {
  const s = yearOf(start);
  if (!end) return `${s} →`;
  const e = yearOf(end);
  return s === e ? s : `${s} – ${e}`;
}

export type FeedRow = ProjectListItem & { year: string; yearRange: string; statusClass: string };

/** A project with the labels its demo rows show precomputed. */
export function toFeedRow(p: ProjectListItem): FeedRow {
  return {
    ...p,
    year: yearOf(p.startDate),
    yearRange: yearRange(p.startDate, p.endDate),
    statusClass: `status-pill status-pill--${p.lifecycleStatus.toLowerCase()}`,
  };
}

/** Group projects by start year, sorted year desc. */
export function groupByYear<T extends ProjectListItem>(
  projects: readonly T[]
): { year: string; items: readonly T[] }[] {
  const map = new Map<string, T[]>();
  for (const p of projects) {
    const y = yearOf(p.startDate);
    const list = map.get(y) ?? [];
    list.push(p);
    map.set(y, list);
  }
  return [...map.entries()].sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => ({ year, items }));
}
