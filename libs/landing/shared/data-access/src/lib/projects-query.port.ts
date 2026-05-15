import { InjectionToken, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ProjectDataService } from './project.service';
import type { ProjectListItem, ProjectLifecycleStatus } from './project.types';

/**
 * Query shape consumed by any feed-style projects view (archive, search, mini-grid). Includes
 * filter + sort + pagination — same shape works whether backed by an in-memory FE adapter or a
 * future BE endpoint.
 */
export interface ProjectsQuery {
  /** Filter — match if project's start year is in this set. Empty = no year filter. */
  readonly years: readonly number[];
  /** Filter — match if project's lifecycleStatus is in this set. Empty = no status filter. */
  readonly statuses: readonly ProjectLifecycleStatus[];
  /** Filter — match if project has ANY of these skill slugs. Empty = no skill filter. */
  readonly skills: readonly string[];
  /** Sort key. Currently only date desc; sort UI can extend later. */
  readonly sort?: 'startDate-desc' | 'startDate-asc' | 'title-asc';
  /** 1-based page index. Omit for render-all mode. */
  readonly page?: number;
  /** Items per page. Omit for render-all mode. */
  readonly pageSize?: number;
}

export interface ProjectsQueryResult {
  readonly items: readonly ProjectListItem[];
  /** Total matching projects, ignoring pagination. */
  readonly total: number;
  /** Whether more pages exist beyond the current one. */
  readonly hasMore: boolean;
}

/**
 * Port (interface) for querying projects with filters + pagination. The portfolio /projects
 * archive page depends only on this port — the concrete implementation can be:
 *
 * - **FE adapter** (today): loads `/api/projects` once, filters/sorts/paginates in-memory.
 *   Right for V1 portfolio scale (≤ ~30 projects).
 * - **BE adapter** (future): hits `/api/projects?year=&status=&stack=&page=` directly.
 *   Becomes worth doing when count > 50, full-text search lands, or facet counts must be
 *   server-computed.
 *
 * Swap by providing a different class against `PROJECTS_QUERY_PORT` in the route's providers
 * — no page-component code changes required.
 */
export interface ProjectsQueryPort {
  query(q: ProjectsQuery): Observable<ProjectsQueryResult>;

  /**
   * Returns the FULL list (no filters, no pagination) — used by the page to compute facets
   * (year list, top-N skills per category). BE adapter can override this to hit a dedicated
   * facets endpoint that's cheaper than the full list.
   */
  facetsSource(): Observable<readonly ProjectListItem[]>;
}

export const PROJECTS_QUERY_PORT = new InjectionToken<ProjectsQueryPort>('PROJECTS_QUERY_PORT');

// ── FE adapter (today's implementation) ──────────────────────────────────────────────────────

/**
 * In-memory adapter — loads everything from `/api/projects` once (shared by ProjectDataService's
 * cache), then filters/sorts/paginates client-side. Correct for V1 portfolio scale where
 * `ProjectListItem[]` payload is small (~5KB for 20 projects) and instant filter cascade is
 * preferable to per-chip API roundtrip.
 */
export class FeProjectsQueryAdapter implements ProjectsQueryPort {
  private readonly projectService = inject(ProjectDataService);

  query(q: ProjectsQuery): Observable<ProjectsQueryResult> {
    return this.projectService.getPublicProjects().pipe(
      map((all) => {
        const filtered = applyFilters(all, q);
        const sorted = applySort(filtered, q.sort ?? 'startDate-desc');
        const { items, hasMore } = applyPagination(sorted, q.page, q.pageSize);
        return { items, total: filtered.length, hasMore };
      })
    );
  }

  facetsSource(): Observable<readonly ProjectListItem[]> {
    return this.projectService.getPublicProjects();
  }
}

function applyFilters(list: readonly ProjectListItem[], q: ProjectsQuery): readonly ProjectListItem[] {
  const years = new Set(q.years);
  const statuses = new Set(q.statuses);
  const skills = new Set(q.skills);
  return list.filter((p) => {
    if (years.size > 0 && !years.has(new Date(p.startDate).getFullYear())) return false;
    if (statuses.size > 0 && !statuses.has(p.lifecycleStatus)) return false;
    if (skills.size > 0 && !p.skills.some((s) => skills.has(s.slug))) return false;
    return true;
  });
}

function applySort(
  list: readonly ProjectListItem[],
  sort: NonNullable<ProjectsQuery['sort']>
): readonly ProjectListItem[] {
  const copy = [...list];
  switch (sort) {
    case 'startDate-desc':
      return copy.sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0));
    case 'startDate-asc':
      return copy.sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

function applyPagination(
  list: readonly ProjectListItem[],
  page?: number,
  pageSize?: number
): { items: readonly ProjectListItem[]; hasMore: boolean } {
  if (!page || !pageSize) return { items: list, hasMore: false };
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { items: list.slice(start, end), hasMore: end < list.length };
}
