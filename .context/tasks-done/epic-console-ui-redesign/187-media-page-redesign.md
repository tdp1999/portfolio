# Task: Media page redesign — grid, upload, stats, batch operations

## Status: done

## Goal
Redesign the Media Library page with polished grid view, upload dropzone, storage stats, and batch selection — matching Stitch "Media Library" screen (256f25b6).

## Context
Phase 3 of Console UI Redesign. Media is the most complex page — grid/list toggle, upload, stats, batch operations, trash link. Existing functionality must be preserved while applying the new visual direction.

## Acceptance Criteria
- [x] Storage stats row: Total Files count + Total Size + breakdown badges (Images/Videos/Documents)
- [x] Upload dropzone: dashed border #3d4266, cloud icon, "Drag and drop files here" + "or browse files" link
- [x] Filter row: search by filename + file type dropdown
- [x] Grid view (4-col): cards with thumbnail, filename, type+size badges, checkbox for selection
- [x] List view: table with thumbnail column, same filters and pagination
- [x] Grid/list toggle buttons in header (icon buttons, one active state)
- [x] Batch selection: floating bar "N selected" + "Delete Selected" when items checked
- [x] "Trash" link near title with count badge
- [x] Upload progress indicator per file (existing functionality, restyle)
- [x] Cards: #1a1d27 bg, rounded-xl, border #2d3148, hover shadow
- [x] Fixed pagination + footer

**Stitch reference:** screen `256f25b678684d9f` in project `17973930401225587522`

## Files to Touch
- `libs/console/feature-media/src/lib/media-page/media-page.html`
- `libs/console/feature-media/src/lib/media-page/media-page.scss`
- `libs/console/feature-media/src/lib/media-page/media-page.ts`
- `libs/console/feature-media/src/lib/media-trash/` (trash page — same styling)

## Dependencies
- 184 (CRUD template for filter/pagination patterns)

## Complexity: L

## Progress Log
- [2026-03-27] Started
- [2026-03-27] Done — all ACs satisfied
