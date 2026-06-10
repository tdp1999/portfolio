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

/** Group projects by start year, sorted year desc. */
export function groupByYear(
  projects: readonly ProjectListItem[]
): { year: string; items: readonly ProjectListItem[] }[] {
  const map = new Map<string, ProjectListItem[]>();
  for (const p of projects) {
    const y = yearOf(p.startDate);
    const list = map.get(y) ?? [];
    list.push(p);
    map.set(y, list);
  }
  return [...map.entries()].sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => ({ year, items }));
}
