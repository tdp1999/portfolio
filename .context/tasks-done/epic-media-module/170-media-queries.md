# Task: Media Queries + Handlers

## Status: done

## Goal
Implement CQRS query handlers for listing, getting by ID, and storage statistics.

## Context
Queries serve the admin media library UI with filtering, search, and storage usage data.

## Acceptance Criteria
- [x] `ListMediaQuery` + handler: paginated list with mimeType prefix filter, filename search, include-deleted option
- [x] `GetMediaByIdQuery` + handler: single media by ID, throws MEDIA_NOT_FOUND
- [x] `GetStorageStatsQuery` + handler: total files, total bytes, breakdown by mimeType prefix
- [x] `ListDeletedMediaQuery` + handler: paginated list of soft-deleted media (trash view)
- [x] Unit tests for each query handler
- [x] TDD approach

## Technical Notes
- Follow Skill queries pattern
- Storage stats can use Prisma `groupBy` + `_sum` aggregation on `bytes` grouped by mimeType prefix
- Include-deleted flag for admin to see all media

## Files to Touch
- apps/api/src/modules/media/application/queries/*.ts
- apps/api/src/modules/media/application/queries/media-queries.spec.ts
- apps/api/src/modules/media/application/queries/index.ts

## Dependencies
- 167 (Repository port)
- 168 (DTOs)

## Complexity: M

## Progress Log
- 2026-03-21 Started
- 2026-03-21 Done — all ACs satisfied
