# Task: Media FE Library + Service

## Status: pending

## Goal
Create the Angular feature library for media management and the MediaService for API communication.

## Context
Frontend admin media library. Follows the console feature library pattern (like feature-skill).

## Acceptance Criteria
- [ ] New Nx library: `libs/console/feature-media/` (use ng-lib skill)
- [ ] `MediaService` — HTTP client methods for all media API endpoints
- [ ] Methods: upload, uploadBulk, list, getById, updateMetadata, delete, restore, getStats, listTrash
- [ ] Upload methods handle `FormData` construction
- [ ] Upload progress tracking via `HttpClient` `reportProgress` option
- [ ] Media routes configured with lazy loading
- [ ] Route added to console sidebar navigation

**Specialized Skill:** ng-lib — use for library creation.

## Files to Touch
- libs/console/feature-media/ (new library)
- libs/console/feature-media/src/lib/media.service.ts
- libs/console/feature-media/src/lib/media.routes.ts

## Dependencies
- 173 (Backend API must be working)

## Complexity: M

## Progress Log
