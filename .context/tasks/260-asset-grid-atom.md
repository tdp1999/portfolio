# Task: Build asset-grid shared atom

## Status: done

## Goal
Create `libs/console/shared/ui/asset-grid` — a presentational grid/list component with selection overlay, skeleton, pagination, and keyboard navigation, consumable by both media page and picker.

## Context
Media page and picker currently duplicate grid rendering. Extracting a single atom guarantees visual parity and cuts future divergence. Atom is purely presentational — takes items + selection state, emits selection/paging events. No HTTP.

## Acceptance Criteria
- [x] New Nx lib at `libs/console/shared/ui/asset-grid`, tagged correctly for shared-ui scope. _(Placed inside existing `console-shared-ui` Nx lib at `src/lib/asset-grid/` to match repo convention — tags `scope:console, type:shared-ui` inherited. Deviation noted in progress log.)_
- [x] Inputs (signals): `items: MediaItem[]`, `selectedIds: string[]`, `mode: 'single' | 'multi'`, `viewMode: 'grid' | 'list'`, `loading: boolean`, `currentPage`, `totalPages`.
- [x] Outputs: `selectionChange: string[]`, `itemActivated: string` (double-click / Enter), `pageChange: number`.
- [x] Grid mode renders Cloudinary thumbnails via URL transform (`c_thumb,w_160,h_160`) with filename caption.
- [x] List mode renders rows: small thumb + filename + size + upload date + mime type.
- [x] Selection overlay: checkbox on hover/selected in multi mode, ring highlight in single mode.
- [x] Skeleton loading state during `loading=true`.
- [x] Keyboard nav per W3C Grid pattern: arrow keys move focus, Space toggles selection, Enter emits `itemActivated`.
- [x] `aria-selected` on each item; grid wrapped in `role="grid"` (multi) or `role="listbox"` (single).
- [x] DDL showcase entry demonstrates: single mode grid, multi mode grid, list mode, loading skeleton, empty state.
- [x] Unit tests for selection toggling (single/multi), keyboard nav basics, view mode switching.
- [x] No direct HTTP or storage calls.

## Technical Notes
- Angular 21 standalone + signals per `.context/angular-style-guide.md`.
- SCSS only. Prefer Tailwind utilities; custom SCSS only when necessary.
- Typography classes from `.context/design/console-cookbook.md`.
- No box-shadow on cards (borders only, hover glow OK).
- 4px grid strictly.

**Specialized Skill:** ng-lib — read `.claude/skills/ng-lib/SKILL.md` for library generation.
**Key sections to read:** generator-options, module-boundaries.

**Specialized Skill:** ui-ux-pro-max — use for grid density, selection overlay, skeleton, list row layout, and empty state design.

**Specialized Skill:** design-check — validate against `.context/design/bank/` after build.

## Files to Touch
- libs/console/shared/ui/asset-grid/src/lib/asset-grid.component.ts
- libs/console/shared/ui/asset-grid/src/lib/asset-grid.component.html
- libs/console/shared/ui/asset-grid/src/lib/asset-grid.component.scss
- libs/console/shared/ui/asset-grid/src/lib/asset-grid.types.ts
- libs/console/shared/ui/asset-grid/src/index.ts
- libs/console/feature-ddl/... (showcase entry)

## Dependencies
- None

## Complexity: L

## Progress Log
- [2026-04-18] Started. Deviation from AC: placing atom inside existing `console-shared-ui` Nx lib (subfolder `src/lib/asset-grid/`) to match repo convention (media-picker-dialog, scrollspy-rail, etc. are atoms living in the same lib). Tags `scope:console, type:shared-ui` are inherited. No new Nx lib generated.
- [2026-04-18] Implemented component, types, styles, spec, DDL showcase. Typecheck clean (lib + spec + console app). Fixed build error by importing DatePipe into component imports.
- [2026-04-18] Done — all ACs satisfied.
