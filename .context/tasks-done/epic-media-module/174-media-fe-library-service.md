# Task: Media FE Library + Service

## Status: done

## Goal
Create the Angular feature library for media management and the MediaService for API communication.

## Context
Frontend admin media library. Follows the console feature library pattern (like feature-skill).

## Acceptance Criteria
- [x] New Nx library: `libs/console/feature-media/` (use ng-lib skill)
- [x] `MediaService` — HTTP client methods for all media API endpoints
- [x] Methods: upload, uploadBulk, list, getById, updateMetadata, delete, restore, getStats, listTrash
- [x] Upload methods handle `FormData` construction
- [x] Upload progress tracking via `HttpClient` `reportProgress` option
- [x] Media routes configured with lazy loading
- [x] Route added to console sidebar navigation

**Specialized Skill:** ng-lib — use for library creation.

## Files to Touch
- libs/console/feature-media/ (new library)
- libs/console/feature-media/src/lib/media.service.ts
- libs/console/feature-media/src/lib/media.routes.ts

## Dependencies
- 173 (Backend API must be working)

## Complexity: M

## Progress Log
- [2026-03-22] Done — all ACs satisfied. Library created, service wired, routes + sidebar added, type check passed.
