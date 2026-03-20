# Task: Media Module Wiring + Verification

## Status: pending

## Goal
Wire all media components into a NestJS module and verify the full backend works end-to-end.

## Context
Final backend integration task. Connects all ports, adapters, handlers, and controller into a working module.

## Acceptance Criteria
- [ ] `MediaModule` defined with all providers, controllers, imports
- [ ] DI wiring: `STORAGE_SERVICE` → `CloudinaryStorageService`, `SECURITY_SCANNER` → `FileSecurityScanner`, `MEDIA_REPOSITORY` → `PrismaMediaRepository`
- [ ] All command/query handlers registered
- [ ] Schedule module imported for cron jobs
- [ ] Module imported in `AppModule`
- [ ] Env var validation for Cloudinary credentials at module init
- [ ] Manual API smoke test: upload, list, get, update metadata, delete, restore
- [ ] All existing tests still pass
- [ ] Type check passes (`npx tsc --noEmit`)

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
