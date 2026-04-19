# Task: Build asset-upload-zone shared atom

## Status: done

## Goal
Generalize the existing `upload-dropzone` into `libs/console/shared/ui/asset-upload-zone` — multi-file drag-drop with per-file progress, per-file error + retry, and cancel.

## Context
Current `upload-dropzone` fires a single `filesSelected` event and parent handles uploads. New atom must own per-file upload lifecycle (progress, error, retry) because picker's Upload tab and media page both need the same rich feedback.

## Acceptance Criteria
- [x] New Nx lib at `libs/console/shared/ui/asset-upload-zone`.
- [x] Inputs: `accept: string` (mime types), `maxFileSize: number`, `multiple: boolean`, `uploadFn: (file: File) => Observable<UploadProgress>`.
- [x] Emits `uploadsComplete: MediaItem[]` when all files finish (successful ones).
- [x] Emits `uploadFailed: { file: File, error: Error }[]` for failed uploads.
- [x] Drag-drop + click-to-pick file input.
- [x] Per-file row shows: filename, size, progress bar (0–100%), cancel button (while uploading), retry button (on error), remove button (after success).
- [x] Client-side validation: mime type match, size limit; reject before starting upload.
- [x] Parent owns the `uploadFn` — atom is transport-agnostic.
- [x] Cancelling an in-flight upload cleans up subscription and removes row.
- [x] DDL showcase: single upload, multi upload, error+retry flow, oversize rejection.
- [x] Unit tests: validation rejects invalid files, progress updates render, cancel removes row, retry restarts upload.
- [x] Keyboard focus-visible on drop zone; Enter/Space triggers file picker.

## Technical Notes
- Replace existing `upload-dropzone` once the new atom proves parity; do not break existing consumers during migration.
- Use `switchMap`/`mergeMap` for concurrent uploads — never nested subscribes (per project convention).
- Types in separate files, no co-location with service.
- Follow Angular v21 signals/control flow style.

**Specialized Skill:** ng-lib — scaffold.

**Specialized Skill:** ui-ux-pro-max — drag-drop visual, progress row layout, error state styling.

## Files to Touch
- libs/console/shared/ui/asset-upload-zone/src/lib/asset-upload-zone.component.ts
- libs/console/shared/ui/asset-upload-zone/src/lib/asset-upload-zone.component.html
- libs/console/shared/ui/asset-upload-zone/src/lib/asset-upload-zone.component.scss
- libs/console/shared/ui/asset-upload-zone/src/lib/upload-row.component.ts
- libs/console/shared/ui/asset-upload-zone/src/lib/asset-upload-zone.types.ts
- libs/console/shared/ui/asset-upload-zone/src/index.ts

## Dependencies
- None

## Complexity: M

## Progress Log
- 2026-04-18 Started
- 2026-04-18 Done — all ACs satisfied
