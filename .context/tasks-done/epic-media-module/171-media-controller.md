# Task: Media REST Controller

## Status: done

## Goal
Create the Media controller with file upload endpoints using NestJS interceptors.

## Context
Controller is a thin transport adapter. File handling via multer interceptors, all logic delegated to command/query bus.

## Acceptance Criteria
- [x] `POST /media/upload` — single file upload via `FileInterceptor`, dispatches `UploadMediaCommand`
- [x] `POST /media/upload/bulk` — multi-file upload via `FilesInterceptor`, dispatches `BulkUploadMediaCommand`
- [x] `GET /media` — list with query params, dispatches `ListMediaQuery`
- [x] `GET /media/stats` — storage statistics, dispatches `GetStorageStatsQuery`
- [x] `GET /media/trash` — deleted media list, dispatches `ListDeletedMediaQuery`
- [x] `GET /media/:id` — get by ID, dispatches `GetMediaByIdQuery`
- [x] `PATCH /media/:id` — update metadata, dispatches `UpdateMediaMetadataCommand`
- [x] `DELETE /media/:id` — soft delete, dispatches `SoftDeleteMediaCommand`
- [x] `POST /media/:id/restore` — restore, dispatches `RestoreMediaCommand`
- [x] All endpoints auth-guarded
- [x] Controller is thin — no error throwing, no validation logic
- [x] File size limit configured at interceptor level (defense in depth)

## Technical Notes
- `@UseInterceptors(FileInterceptor('file'))` for single, `FilesInterceptor('files', 10)` for bulk (max 10)
- `@UploadedFile()` / `@UploadedFiles()` decorators to extract file(s)
- Configure multer limits: `limits: { fileSize: 50 * 1024 * 1024 }` (50MB max, per-type checked in handler)
- Follow existing controller pattern — thin adapter only

## Files to Touch
- apps/api/src/modules/media/presentation/media.controller.ts

## Dependencies
- 169 (Commands)
- 170 (Queries)

## Complexity: M

## Progress Log
- [2026-03-21] Done — all ACs satisfied
