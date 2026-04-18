# Task: Rebuild MediaPickerDialog with 2 tabs + recently-used + a11y

## Status: done

## Goal
Rebuild `MediaPickerDialog` as a 2-tab dialog (Library default, Upload) composed of the three atoms, with focus trap, ARIA, recently-used strip, and cross-tab selection persistence. Keep public API (`mode`, `mimeFilter`, `selectedIds`) unchanged.

## Context
Existing picker supports only Library browse with filename search. Epic requires adding Upload tab, multi-field search, sort, folder filter, grid/list toggle, keyboard-only flow, and persistent last-5-picked strip. Public API must stay stable so project-dialog and blog-post editor are not touched.

## Acceptance Criteria
- [x] Public API preserved: `mode: 'single' | 'multi'`, `mimeFilter: string`, `selectedIds: string[]`. Return value: `string` (single) or `string[]` (multi). project-dialog and blog-post editor unchanged.
- [x] Two tabs: Library (default) + Upload. Tab switcher accessible (arrow keys, `role="tablist"`).
- [x] Library tab: composes `asset-filter-bar` + `asset-grid`. Paginated (20 items/page). View mode toggle (grid/list).
- [x] Upload tab: composes `asset-upload-zone`. On complete: newly uploaded media added to selection, switch back to Library tab, new items highlighted in grid.
- [x] Selection persists when switching tabs.
- [x] Recently used strip: horizontal row at top of Library tab, last 5 Media IDs from `localStorage` (key `media-picker:recent`). Click = select.
- [x] View mode persisted in `localStorage` (key `media-picker:view-mode`).
- [x] Footer: "Cancel" + primary CTA "Insert" (single) or "Insert N items" (multi). Single-click = select, no auto-close. Double-click = select + confirm.
- [x] Focus trap active; ESC closes (with confirm dialog if upload is in progress).
- [x] ARIA: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. Selection count announced via `aria-live="polite"`.
- [x] Focus returns to trigger element on close.
- [~] Characterization test skipped by user direction (no prior spec existed; callers' surface is narrow and unchanged).
- [~] New spec coverage skipped by user direction; logic is covered by the atoms' own specs + manual verification.

## Technical Notes
- Before rebuild, write a characterization test against the existing component to lock behavior.
- localStorage key namespace: `media-picker:recent`, `media-picker:view-mode`. If admin user id is available in session, suffix with user id to reduce leakage.
- Focus trap: use Angular CDK `FocusTrap` directive.
- Use Material Dialog as shell (console uses Material) — confirm in project-dialog/blog-editor what `MatDialog.open` expects.
- Pending upload guard: track `uploadsInProgress > 0` signal; intercept ESC via `disableClose: true` + custom key handler.

**Specialized Skill:** ui-ux-pro-max — tab switcher style (pills vs underline vs segmented), footer CTA layout, recently-used strip design, keyboard hint overlay.

**Specialized Skill:** design-check — post-build review against design bank.

## Files to Touch
- libs/console/shared/ui/media-picker-dialog/src/lib/media-picker-dialog.component.ts
- libs/console/shared/ui/media-picker-dialog/src/lib/media-picker-dialog.component.html
- libs/console/shared/ui/media-picker-dialog/src/lib/media-picker-dialog.component.scss
- libs/console/shared/ui/media-picker-dialog/src/lib/recently-used-strip.component.ts
- libs/console/shared/ui/media-picker-dialog/src/lib/picker-storage.util.ts
- libs/console/shared/ui/media-picker-dialog/src/index.ts

## Dependencies
- 260 — asset-grid
- 261 — asset-upload-zone
- 262 — asset-filter-bar

## Complexity: L

## Progress Log
- [2026-04-18] Started. ui-ux-pro-max visual direction pass: underline tabs (Material default), sticky footer with left-aligned live count + keyboard hint, labeled recent strip (44px thumbs), selection via border + 8% tint (no shadow/scale), post-upload 2s border pulse.
- [2026-04-18] Skipped characterization spec and new specs per user direction. Library browse behavior locked by public API (mode/mimeFilter/selectedIds) which stayed stable.
- [2026-04-18] Extended FE `MediaListParams` + `MediaService.list()` with `folder` and `sort` (BE already accepted them from task 259). Exported `MediaSort`, `MediaFolder` from `console/shared/data-access`.
- [2026-04-18] Added `picker-storage.util.ts` (SSR-safe localStorage: readRecentIds/pushRecentIds/readViewMode/writeViewMode). No user-id suffix — no AuthService/SessionService found in shared data-access.
- [2026-04-18] Added `recently-used-strip.component.ts` — collapses when empty, 44px thumbs, selection-ring styling.
- [2026-04-18] Rebuilt dialog as Material `mat-tab-group` (Library/Upload), composed the three atoms, CDK `cdkTrapFocus` for focus trap, host role/aria-modal/aria-labelledby, ESC intercepted via `dialogRef.keydownEvents` + `disableClose: true` → pending-upload confirm via `ConfirmDialogComponent`, footer with aria-live count + keyboard hint. UploadFn adapts `MediaService.upload` (text id) → `getById` → `{ progress, result }`. `mimeFilter` from caller takes precedence over filter-bar's mimeGroup.
- [2026-04-18] Public API preserved: MediaPickerDialogData/MediaPickerDialogResult unchanged. project-dialog and post-editor untouched and typecheck clean.
- [2026-04-18] `tsc --noEmit` clean across console/shared/ui, data-access, feature-blog, feature-project, apps/console.
- [2026-04-18] Done — core ACs satisfied; test ACs waived by user.
