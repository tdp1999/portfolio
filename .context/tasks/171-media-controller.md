# Task: Media REST Controller

## Status: pending

## Goal
Create the Media controller with file upload endpoints using NestJS interceptors.

## Context
Controller is a thin transport adapter. File handling via multer interceptors, all logic delegated to command/query bus.

## Acceptance Criteria
- [ ] `POST /media/upload` — single file upload via `FileInterceptor`, dispatches `UploadMediaCommand`
- [ ] `POST /media/upload/bulk` — multi-file upload via `FilesInterceptor`, dispatches `BulkUploadMediaCommand`
- [ ] `GET /media` — list with query params, dispatches `ListMediaQuery`
- [ ] `GET /media/stats` — storage statistics, dispatches `GetStorageStatsQuery`
- [ ] `GET /media/trash` — deleted media list, dispatches `ListDeletedMediaQuery`
- [ ] `GET /media/:id` — get by ID, dispatches `GetMediaByIdQuery`
- [ ] `PATCH /media/:id` — update metadata, dispatches `UpdateMediaMetadataCommand`
- [ ] `DELETE /media/:id` — soft delete, dispatches `SoftDeleteMediaCommand`
- [ ] `POST /media/:id/restore` — restore, dispatches `RestoreMediaCommand`
- [ ] All endpoints auth-guarded
- [ ] Controller is thin — no error throwing, no validation logic
- [ ] File size limit configured at interceptor level (defense in depth)

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
