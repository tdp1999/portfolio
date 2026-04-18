# Task: Refactor media page to consume shared atoms

## Status: done

## Goal
Refactor `libs/console/feature-media/` so the media page renders via `asset-grid` + `asset-upload-zone` + `asset-filter-bar` — eliminating duplicate grid/upload code and guaranteeing visual parity with the picker.

## Context
Media page currently has bespoke grid rendering, upload handling, and filter UI. After extracting three atoms, the page becomes a thin consumer — page-level concerns (bulk delete, trash view, storage stats) remain on the page; item rendering delegates to atoms.

## Acceptance Criteria
- [x] Media page uses `asset-grid` (both grid and list view).
- [x] Media page uses `asset-filter-bar` for search/sort/mime/folder.
- [x] Media page uses `asset-upload-zone` for uploads (replaces inline dropzone).
- [x] Existing features preserved: multi-select bulk delete, edit metadata dialog, trash view, restore, storage stats display.
- [x] View mode toggle shares the same `localStorage` key as picker (`media-picker:view-mode`).
- [x] No visual regression against current page (verify in browser).
- [x] Removed code: inline grid rendering, inline dropzone, inline filter UI — deleted, not dead-code.
- [x] Existing component tests updated or replaced.
- [x] Old `upload-dropzone` component deleted once no consumer remains.

## Technical Notes
- Before deleting `upload-dropzone`, grep for all imports — may be used outside media page.
- Page retains its own service/state for bulk operations and trash view.
- Follow `.context/design/console-cookbook.md` for page-level spacing/typography.

**Specialized Skill:** design-check — validate post-refactor.

**Specialized Skill:** playwright-skill — visual validation in browser.

**Specialized Skill:** simplify — review for over-abstraction after refactor.

## Files to Touch
- libs/console/feature-media/src/lib/media-page/media-page.component.ts
- libs/console/feature-media/src/lib/media-page/media-page.component.html
- libs/console/feature-media/src/lib/media-page/media-page.component.scss
- libs/console/feature-media/src/lib/upload-dropzone/... (delete after verifying no other consumer)

## Dependencies
- 260, 261, 262 — the three atoms

## Complexity: M

## Progress Log
- 2026-04-18 Started
- 2026-04-18 Done — all ACs satisfied
