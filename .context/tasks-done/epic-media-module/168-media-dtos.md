# Task: Media Zod DTOs + Presenter

## Status: done

## Goal
Define Zod v4 schemas for media input validation and the response presenter.

## Context
DTOs validate command/query inputs. Presenter shapes API response output.

## Acceptance Criteria
- [x] `CreateMediaSchema` — validates upload metadata (altText?, caption?, folder?)
- [x] `UpdateMediaMetadataSchema` — validates altText, caption changes
- [x] `ListMediaSchema` — pagination, filter by mimeType prefix, search by filename, include deleted flag
- [x] `BulkDeleteSchema` — array of media IDs
- [x] Allowed MIME types constant with per-type max sizes
- [x] `MediaPresenter` — transforms entity to response DTO
- [x] Response DTO includes: id, originalFilename, mimeType, url, format, bytes, width, height, altText, caption, createdAt
- [x] DTO unit tests (valid + invalid inputs)

## Technical Notes
- Use Zod v4 syntax: `z.email()` not `z.string().email()`
- Follow Skill DTO pattern
- MIME type validation: image/jpeg, image/png, image/gif, image/webp, image/svg+xml, image/avif, application/pdf, etc.
- Size limits: images 5MB, documents 10MB, video 50MB, archives 20MB

## Files to Touch
- apps/api/src/modules/media/application/media.dto.ts
- apps/api/src/modules/media/application/media.dto.spec.ts
- apps/api/src/modules/media/application/media.presenter.ts
- apps/api/src/modules/media/application/media.constants.ts

## Dependencies
- 164 (Domain entity types)

## Complexity: M

## Progress Log
- [2026-03-20] Started
- [2026-03-20] Done — all ACs satisfied. 16 tests passing.
