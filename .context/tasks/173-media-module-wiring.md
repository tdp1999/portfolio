# Task: Media Module Wiring + Verification

## Status: in-progress

## Goal
Wire all media components into a NestJS module and verify the full backend works end-to-end.

## Context
Final backend integration task. Connects all ports, adapters, handlers, and controller into a working module.

## Acceptance Criteria
- [x] `MediaModule` defined with all providers, controllers, imports
- [x] DI wiring: `STORAGE_SERVICE` → `CloudinaryStorageService`, `SECURITY_SCANNER` → `FileSecurityScanner`, `MEDIA_REPOSITORY` → `MediaRepository`
- [x] All command/query handlers registered
- [x] Schedule module imported for cron jobs
- [x] Module imported in `AppModule`
- [x] Env var validation for Cloudinary credentials at module init
- [ ] Manual API smoke test: upload, list, get, update metadata, delete, restore
- [x] All existing tests still pass
- [x] Type check passes (`npx tsc --noEmit`)

## Technical Notes
- Follow Skill module wiring pattern
- Ensure ScheduleModule.forRoot() is in AppModule if not already
- Cloudinary env vars: fail fast at startup if missing

## Files to Touch
- apps/api/src/modules/media/media.module.ts
- apps/api/src/app.module.ts

## Dependencies
- 163-172 (all backend tasks)

## Complexity: S

## Progress Log
- [2026-03-21] Started — created MediaModule, wired DI tokens, added to AppModule, tsc passes
