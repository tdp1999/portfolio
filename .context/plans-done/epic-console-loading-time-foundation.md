# Epic: Console Loading + Time Display Foundation

**Status:** Done — 2026-04-27. Implemented directly from the epic (no task breakdown).

## Summary

Unify loading indicators across all console pages and introduce a consistent relative-time display component. Establishes the UX primitives that every list/table/form page will reuse in later epics.

## Why

Today the console has ad-hoc loading treatments: `spinner-overlay` on most tables, `MEDIA_PICKER_MIN_LOADING_MS` only patched onto media. Flicker on fast loads, heavy overlay on slow ones. No pattern for "background refresh" (e.g., reloading list after save) or route change progress. Timestamps are also inconsistent and verbose; users need both at-a-glance ("3 hours ago") and precise ("April 20, 2026 at 2:32 PM").

## Target Users

- Site owner working in the console daily — wants quick, predictable feedback when data is loading.

## Scope

### In Scope

- `.context/design/loading.md` — loading taxonomy (doc first)
- `<console-skeleton-row>` / `<console-skeleton-table>` reusable components
- Top linear progress bar at layout-shell level — dual purpose: route transitions + background list refresh
- `<console-relative-time>` component — relative text + tooltip with absolute date + full relative
- Remove / replace existing `spinner-overlay` usage in list pages (keep for true blocking ops only)

### Out of Scope

- Table column sort / `updatedAt` column integration → Stream B
- Per-module migration to new loading pattern → handled as part of Stream B rollout
- Form-level loading (save in-flight) — already handled via button spinner, no change

## High-Level Requirements

### Doc (Task 010)

1. Write `.context/design/loading.md` with taxonomy table:
   - **Skeleton rows** → initial list load / filter change / pagination; min-duration 300ms to prevent flicker
   - **Top progress bar** → route transitions, background list refresh after mutations
   - **Button spinner** → action in-flight (Save, Delete)
   - **Full-screen overlay** → rare critical blocking ops only
   - **Shimmer placeholder** → images / media thumbnails
   - SSR: no loading, render server content
2. Rules: skeleton only for *initial* or *filter-change* loads; progress bar for *refresh*; never both simultaneously

### Skeleton components (Task 020)

3. `<console-skeleton-row>` — mimics a table row with N shimmer cells, accepts `[columns]` input
4. `<console-skeleton-table>` — renders N skeleton rows (default 8), accepts `[columns]` + `[rows]`
5. Use same 4px grid + token colors as real tables (consistent visual language)
6. Animated shimmer (CSS keyframe, subtle, respects `prefers-reduced-motion`)

### Top progress bar (Task 030)

7. `<console-progress-bar>` in `layout-shell` — linear, ~2px, fixed top of content area
8. Service `ProgressBarService` with `start()` / `complete()` API + ref-counted (multiple concurrent calls stack)
9. Auto-wire to Angular `Router` events (NavigationStart → start, NavigationEnd/Error/Cancel → complete)
10. List pages call `start()`/`complete()` during background refresh (after save, delete, restore)

### Relative time component (Task 040)

11. `<console-relative-time>` — `input [value]: Date | string`
12. Display: relative ("3 hours ago", "2 days ago", "just now", "last month")
13. Auto-refresh for recent times (< 1 hour) every 60s; no refresh for older
14. Tooltip (matTooltip): two lines
    - Line 1: absolute — `April 20, 2026 at 2:32 PM`
    - Line 2: full relative — `3 hours 14 minutes ago`
15. No timezone display (internal console tool, single user)

## Dependencies / Prerequisites

- None — foundation epic

## Acceptance Criteria

- `.context/design/loading.md` merged and referenced from CLAUDE.md
- Skeleton components usable in any feature lib via `@portfolio/console/shared/ui`
- Top progress bar visible on route change without flicker for fast navigations
- Relative-time component renders correct relative text + accurate tooltip across date spans (< 1min, minutes, hours, days, weeks, months, years)
- No visual regression on existing pages that currently use `spinner-overlay`

## Open Questions

- Should skeleton rows match exact column widths of the real table, or be generic? (decide during task breakdown)
