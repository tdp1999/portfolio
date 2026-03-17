# Task: Category Module - Module Wiring + Verify

## Status: done

## Goal

Wire Category module into NestJS and verify full BE vertical slice works.

## Context

Final BE task. Register module, verify all endpoints via manual testing or REST client.

## Acceptance Criteria

- [x] `CategoryModule` with CqrsModule import, forwardRef for Auth/User
- [x] Repository provided via DI token (`CATEGORY_REPOSITORY` → `CategoryRepository`)
- [x] All command + query handlers registered as providers
- [x] Module imported in `AppModule`
- [x] Barrel export `index.ts`
- [x] Verify all 6 endpoints work (list, getById, getBySlug, create, update, delete)
- [x] Verify auth guards work (public reads, admin-only writes)
- [x] Verify soft delete works (deleted categories excluded from list)

## Technical Notes

Follow Tag module wiring. Export `CATEGORY_REPOSITORY` for future modules that may need it.

## Files to Touch

- apps/api/src/modules/category/category.module.ts
- apps/api/src/modules/category/index.ts
- apps/api/src/app/app.module.ts

## Dependencies

- 149-category-controller

## Complexity: S

Module registration and verification.

## Progress Log
- [2026-03-17] Done — all ACs satisfied, all 6 endpoints verified via curl
