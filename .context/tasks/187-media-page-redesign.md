# Task: Media page redesign — grid, upload, stats, batch operations

## Status: pending

## Goal
Redesign the Media Library page with polished grid view, upload dropzone, storage stats, and batch selection — matching Stitch "Media Library" screen (256f25b6).

## Context
Phase 3 of Console UI Redesign. Media is the most complex page — grid/list toggle, upload, stats, batch operations, trash link. Existing functionality must be preserved while applying the new visual direction.

## Acceptance Criteria
- [ ] Storage stats row: Total Files count + Total Size + breakdown badges (Images/Videos/Documents)
- [ ] Upload dropzone: dashed border #3d4266, cloud icon, "Drag and drop files here" + "or browse files" link
- [ ] Filter row: search by filename + file type dropdown
- [ ] Grid view (4-col): cards with thumbnail, filename, type+size badges, checkbox for selection
- [ ] List view: table with thumbnail column, same filters and pagination
- [ ] Grid/list toggle buttons in header (icon buttons, one active state)
- [ ] Batch selection: floating bar "N selected" + "Delete Selected" when items checked
- [ ] "Trash" link near title with count badge
- [ ] Upload progress indicator per file (existing functionality, restyle)
- [ ] Cards: #1a1d27 bg, rounded-xl, border #2d3148, hover shadow
- [ ] Fixed pagination + footer

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
