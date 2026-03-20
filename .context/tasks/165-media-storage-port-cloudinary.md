# Task: Storage Port + Cloudinary Adapter

## Status: done

## Goal
Define the IStorageService port interface and implement the Cloudinary adapter.

## Context
Port/Adapter pattern enables provider-agnostic storage. Cloudinary is the first (and current) implementation. Future providers (S3) swap in via DI with zero domain changes.

## Acceptance Criteria
- [x] `IStorageService` port interface defined with: `upload`, `uploadBulk`, `delete`, `generateUrl`
- [x] `StorageResult` and `BulkUploadResult` types defined
- [x] `STORAGE_SERVICE` injection token created
- [x] `CloudinaryStorageService` implements `IStorageService`
- [x] Upload: sends Buffer to Cloudinary with folder, returns `StorageResult`
- [x] Upload bulk: parallel via `Promise.allSettled`, returns succeeded + failed arrays
- [x] Delete: removes asset from Cloudinary by publicId
- [x] `generateUrl`: returns Cloudinary secure URL (with optional transform params)
- [x] Env var validation at service init (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- [x] Folder structure: `portfolio/{folder}` where folder comes from upload options
- [x] Unit tests with mocked Cloudinary SDK
- [x] Bulk upload limited to max 10 files per request

## Technical Notes
- Install `cloudinary` npm package
- Cloudinary SDK v2: `cloudinary.v2.uploader.upload_stream()` for Buffer uploads
- `UploadOptions`: `{ folder: string, resourceType?: 'image' | 'video' | 'raw' }`
- Error handling: catch Cloudinary errors, wrap in `MEDIA_UPLOAD_FAILED`

## Files to Touch
- apps/api/src/modules/media/application/ports/storage.service.port.ts
- apps/api/src/modules/media/infrastructure/adapters/cloudinary-storage.service.ts
- apps/api/src/modules/media/infrastructure/adapters/cloudinary-storage.service.spec.ts
- apps/api/src/modules/media/application/media.token.ts

## Dependencies
- None (port is independent of schema)

## Complexity: L

## Progress Log
- [2026-03-20] Started
- [2026-03-20] Done — all ACs satisfied. 13 tests passing.
