# Task: CRUD page template — header, filter bar, table, fixed pagination

## Status: done

## Goal
Establish a consistent CRUD page template pattern: page header with title+action button, expandable filter bar, styled data table container, and fixed-bottom pagination bar.

## Context
Phase 2 of Console UI Redesign. This task creates the visual template that will be applied to Tags, Categories, Skills, and Users pages. Focus on styling and layout — not changing data logic.

## Acceptance Criteria
- [x] Page header: title h1 (left) + primary action button (right), same baseline
- [x] Subtitle below title (#94a3b8, smaller text)
- [x] Filter bar: row of filter controls (search input + dropdown selects), dark filled style (#1a1d27 bg, rounded-lg)
- [x] FilterSearchComponent: magnifying glass icon, placeholder text, proper dark styling
- [x] FilterSelectComponent: dropdown arrow, dark bg, proper dark styling
- [x] Data table container: #1a1d27 bg, rounded-xl, border #2d3148
- [x] Table header row: uppercase, small, #64748b text
- [x] Table body rows: hover state (slightly lighter bg), proper text colors
- [x] 3-dot action menu icon on each row's right side
- [x] Fixed-bottom pagination bar: sticky above footer, #1a1d27 bg, border-top #2d3148
- [x] Pagination content: "Items per page: 20" dropdown (left), "1-N of M" + arrows (right)

## Technical Notes
Modify existing `FilterBarComponent`, `FilterSearchComponent`, `FilterSelectComponent` styling. The pagination fix requires CSS `position: sticky; bottom: [footer-height]` or restructuring the layout flow. Test with scrollable content.

## Files to Touch
- `libs/console/shared/ui/src/lib/filter-bar/filter-bar.ts`
- `libs/console/shared/ui/src/lib/filter-bar/filter-search.ts`
- `libs/console/shared/ui/src/lib/filter-bar/filter-select.ts`
- `libs/console/shared/ui/src/styles/material/_overrides.scss` (table, paginator overrides)
- `libs/console/shared/ui/src/lib/main-layout/main-layout.scss` (pagination sticky positioning)

## Dependencies
- 180 (background), 182 (footer — pagination sits above it)

## Complexity: M

## Progress Log
- 2026-03-26 Started
- 2026-03-26 Done — all ACs satisfied
