# Task: Build asset-filter-bar shared atom

## Status: done

## Goal
Create `libs/console/shared/ui/asset-filter-bar` — search input + MIME group chips + folder dropdown + sort dropdown, bound to `ListMediaQuery` params.

## Context
Picker and media page both need the same filter/sort UX. Atom owns the UI; parent owns data fetching.

## Acceptance Criteria
- [x] New Nx lib at `libs/console/shared/ui/asset-filter-bar`.
- [x] Inputs: `search: string`, `mimeGroup: MimeGroup | null`, `folder: UploadFolder | null`, `sort: SortOption`, `foldersAvailable: UploadFolder[]`.
- [x] Outputs: `searchChange` (debounced 300ms), `mimeGroupChange`, `folderChange`, `sortChange`.
- [x] MIME groups as chips: image, video, pdf, doc, archive (plus "all" reset).
- [x] Folder dropdown populated from `UPLOAD_FOLDERS` enum; "All folders" default option.
- [x] Sort dropdown: Newest / Oldest / Name A→Z / Size desc.
- [x] Clear-all button when any filter is active.
- [x] Responsive: chips wrap, dropdowns stay aligned; mobile-friendly.
- [x] DDL showcase: default state, active filters, clear-all action.
- [x] Unit tests: debounced emit, chip toggle, clear-all resets all outputs.
- [x] Types (MimeGroup, SortOption, UploadFolder) in separate `.types.ts`.

## Technical Notes
- Debounce via rxjs `debounceTime(300)` on search input.
- Chip visual style per console design bank — use `chip-toggle-group` shared comp if applicable.
- Types shared with BE via `libs/shared/types` if not already exported.

**Specialized Skill:** ng-lib — scaffold.

**Specialized Skill:** ui-ux-pro-max — chip density, dropdown alignment, active-filter visual, clear-all placement.

## Files to Touch
- libs/console/shared/ui/asset-filter-bar/src/lib/asset-filter-bar.component.ts
- libs/console/shared/ui/asset-filter-bar/src/lib/asset-filter-bar.component.html
- libs/console/shared/ui/asset-filter-bar/src/lib/asset-filter-bar.component.scss
- libs/console/shared/ui/asset-filter-bar/src/lib/asset-filter-bar.types.ts
- libs/console/shared/ui/asset-filter-bar/src/index.ts

## Dependencies
- 259 — needs agreed-upon param names (sort/folder) matching BE query

## Complexity: M

## Progress Log
- [2026-04-18] Started. Follows asset-grid/asset-upload-zone pattern — new atom lives at `libs/console/shared/ui/src/lib/asset-filter-bar/` (same single-lib convention already used for the other two picker atoms), not a separate Nx lib. Adjusts "Files to Touch" paths accordingly.
- [2026-04-18] Built component: search input with 300ms rxjs debounce, 5 MIME chips + "All" reset (single-select semantics, emits null when chip deselected), folder dropdown bound to UPLOAD_FOLDERS, sort dropdown (4 options). `hasActiveFilters` computed drives clear-all visibility. SCSS reuses existing `.chip-toggle` visual from chip-toggle-group.
- [2026-04-18] Types: MimeGroup / SortOption / UploadFolder declared locally in `.types.ts` (not yet in libs/shared/types — FE-only concerns; BE already has its own UPLOAD_FOLDERS). Exported from shared/ui index alongside label maps.
- [2026-04-18] DDL: added "Asset Filter Bar" section with default stateful demo + active-filters demo.
- [2026-04-18] Tests: 9 unit tests pass — debounce coalescing, chip toggle on/off, All chip reset, aria-pressed, clear-all visibility + full reset. `tsc --noEmit` clean across ui lib, console app, and spec tsconfig.
- [2026-04-18] Done — all ACs satisfied.
