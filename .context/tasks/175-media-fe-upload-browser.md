# Task: Media FE Upload Dropzone + Browser UI

## Status: pending

## Goal
Build the main media library page with upload dropzone and grid/list file browser.

## Context
Primary admin UI for media management. Drag-and-drop upload with per-file progress, browsable media grid with list toggle.

## Acceptance Criteria
- [ ] Media library page component with responsive layout
- [ ] Upload dropzone: drag & drop area + click-to-browse fallback
- [ ] Multi-file upload support with per-file progress indicators
- [ ] File type and size validation before upload (client-side pre-check)
- [ ] Grid view: thumbnail cards with filename, type badge, size
- [ ] List view: table with columns (thumbnail, name, type, size, date, actions)
- [ ] Grid/list toggle persisted in localStorage
- [ ] Search bar: filter by filename
- [ ] Filter: by MIME type prefix (images, documents, video, archives)
- [ ] Pagination for media list
- [ ] Storage usage widget: total files, total size, type breakdown
- [ ] Empty state for no media
- [ ] Loading states (skeletons)

## Technical Notes
- Use Angular Signals for state management
- Use Angular Material components where appropriate (table, paginator, chips for filters)
- Dropzone: native HTML5 drag events (`dragover`, `drop`), no external library needed
- Per-file progress: `HttpClient` with `reportProgress: true` + `observe: 'events'`
- Thumbnails: use Cloudinary URL with transform params for small previews

## Files to Touch
- libs/console/feature-media/src/lib/media-page/media-page.ts
- libs/console/feature-media/src/lib/media-page/media-page.html
- libs/console/feature-media/src/lib/media-page/media-page.scss
- libs/console/feature-media/src/lib/upload-dropzone/upload-dropzone.ts (component)

## Dependencies
- 174 (FE library + service)

## Complexity: XL

## Progress Log
