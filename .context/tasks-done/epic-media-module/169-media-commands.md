# Task: Media Commands + Handlers

## Status: done

## Goal
Implement CQRS command handlers for upload (single + bulk), update metadata, soft delete, restore, and hard delete.

## Context
Commands orchestrate the upload pipeline: validate → scan → store → persist. This is the core business logic layer.

## Acceptance Criteria
- [x] `UploadMediaCommand` + handler: validate size/type → security scan → upload to Cloudinary → create entity → persist
- [x] `BulkUploadMediaCommand` + handler: validate each → scan each → `uploadBulk` → persist succeeded → return succeeded + failed
- [x] `UpdateMediaMetadataCommand` + handler: find by ID → updateMetadata → persist
- [x] `SoftDeleteMediaCommand` + handler: find by ID → softDelete → persist
- [x] `RestoreMediaCommand` + handler: find by ID → restore → persist
- [x] `HardDeleteMediaCommand` + handler: delete from Cloudinary → hard delete from DB
- [x] All handlers inject ports via tokens (STORAGE_SERVICE, SECURITY_SCANNER, MEDIA_REPOSITORY)
- [x] Error codes used: MEDIA_NOT_FOUND, MEDIA_INVALID_INPUT, MEDIA_FILE_TOO_LARGE, MEDIA_UNSUPPORTED_TYPE, MEDIA_UPLOAD_FAILED, MEDIA_SECURITY_THREAT, MEDIA_ALREADY_DELETED
- [x] Unit tests for each command handler with mocked ports
- [x] TDD approach

## Technical Notes
- Upload pipeline order: size check → MIME type check → security scan → Cloudinary upload → DB persist
- Bulk upload uses `Promise.allSettled` for partial success
- `HardDeleteMediaCommand` is used by the scheduled cleanup job, not exposed via API directly
- Follow existing command pattern from Skill module

## Files to Touch
- apps/api/src/modules/media/application/commands/*.ts
- apps/api/src/modules/media/application/commands/media-commands.spec.ts
- apps/api/src/modules/media/application/commands/index.ts

## Dependencies
- 164 (Domain entity)
- 165 (Storage port)
- 166 (Security scanner port)
- 167 (Repository port)
- 168 (DTOs for validation)

## Complexity: XL

## Progress Log
- [2026-03-21] Started — TDD approach, writing tests first
- [2026-03-21] Done — all ACs satisfied, 21/21 tests passing
