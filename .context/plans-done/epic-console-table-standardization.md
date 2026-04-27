# Epic: Console Table Standardization

## Summary

Standardize every console list/table with: default order by `updatedAt desc`, a "Last updated" column using `<console-relative-time>`, clickable column sort (MatSort), and a unified soft-delete toggle ("Show deleted" off by default, faded rows + restore action). BE extended with generic `sortBy` / `sortDir` params and whitelist per module.

## Why

Current tables have inconsistent ordering (some by `displayOrder`, some by creation date, some arbitrary), no sort interaction, and soft-delete handling varies (experiences always shows deleted with `includeDeleted = true`, others hide them). Users can't find recently-edited records, can't sort, and have no standard way to review / restore archived items.

## Target Users

- Site owner — "what did I touch last?" becomes the default view; sort by any column works; archived records are available but don't clutter primary view.

## Scope

### In Scope

- BE list DTOs extended with `sortBy?: string` + `sortDir?: 'asc' | 'desc'`; per-module whitelist of sortable fields
- All list repositories default to `updatedAt desc` when no sort specified
- FE: add "Last updated" column using `<console-relative-time>` (from Stream A) to every table
- FE: wire MatSort into every `mat-table`, emit sortChange → service → BE
- Soft-delete toggle pattern: filter bar switch "Show deleted", off by default; deleted rows faded + "Restore" action replacing Edit/Delete
- Swap list pages from `spinner-overlay` to skeleton rows (from Stream A) during initial/filter-change loads
- Wire top progress bar (from Stream A) for background refresh after mutations

### Out of Scope

- Advanced filter panel (Agoda-style drawer) — deferred to backlog
- Search `updateOn` bug — deferred
- Display-order UX redesign — deferred (keep current column, sortable)

## High-Level Requirements

### BE: Generic sort support (Tasks 010-020)

1. Define reusable `ListQueryParams` type in `libs/shared/types`: `{ page, limit, search?, sortBy?, sortDir?, includeDeleted? }`
2. Each module's list query whitelists allowed `sortBy` fields (reject / fallback on invalid)
3. Default when no `sortBy`: `updatedAt desc`
4. Update Prisma repositories accordingly; keep `displayOrder asc` secondary sort only where it was the primary (e.g., Skill) when user explicitly selects it
5. Tests: repository returns correct order for default, each whitelisted sort, invalid sort falls back cleanly

### FE: Table sort wiring (Task 030)

6. All list pages add `matSort` to `<table>` and `matSortHeader` to sortable `<th>`
7. Component listens to `(matSortChange)` → signals for `sortBy` / `sortDir` → `loadList()` call
8. Reset pagination to page 1 on sort change
9. Default displayed sort indicator matches BE default (`updatedAt desc`)

### FE: Last updated column (Task 040)

10. Add `lastUpdated` column to every list: `<console-relative-time [value]="row.updatedAt" />`
11. Column placed near end, before actions
12. All BE list responses already include `updatedAt` — verify; add if missing

### FE: Skeleton + progress bar swap (Task 050)

13. Replace `console-spinner-overlay` in list pages with `<console-skeleton-table>` during initial + filter-change loads
14. After mutations (save/delete/restore), call `ProgressBarService.start()` + `complete()` — no skeleton, no spinner
15. Remove `MEDIA_PICKER_MIN_LOADING_MS` specific patch — skeleton component has min-duration built in
16. `spinner-overlay` kept only for bulk destructive ops

### Soft-delete toggle (Tasks 060-070)

17. Add `<mat-slide-toggle>` "Show deleted" to `<console-filter-bar>` slot (or as standalone filter component)
18. Default: off → BE receives `includeDeleted: false`
19. When on: deleted rows rendered with `.opacity-50` + action column shows "Restore" icon button (replace Edit/Delete)
20. Apply to every module with `deletedAt` column: experiences, projects, skills, categories, tags, blog posts, media (if applicable)
21. Experiences page currently forces `includeDeleted = true` — flip to toggle-driven

## Dependencies / Prerequisites

- **Stream A** completed: requires `<console-relative-time>`, `<console-skeleton-table>`, `<console-progress-bar>`
- **Stream C** completed: requires `enumLabel` pipe if any sortable column involves enums (for display)

## Acceptance Criteria

- Every list page defaults to `updatedAt desc`
- Every list table has at least: name/identity column sortable, `updatedAt` sortable (and shown)
- Every module with `deletedAt` has "Show deleted" toggle working as specified
- Initial/filter loads use skeleton; background refresh uses top bar; no `spinner-overlay` on list pages
- BE rejects / falls back cleanly on unknown `sortBy`

## Open Questions

- Skill default sort: keep `displayOrder asc` as module-specific default, or follow global `updatedAt desc`? — recommend follow global for consistency; user can sort by displayOrder manually
- Migration backfill: do existing records all have sensible `updatedAt`? (verify in breakdown; run backfill migration if not)
