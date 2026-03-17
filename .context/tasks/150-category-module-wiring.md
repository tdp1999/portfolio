# Task: Category Module - Module Wiring + Verify

## Status: pending

## Goal

Wire Category module into NestJS and verify full BE vertical slice works.

## Context

Final BE task. Register module, verify all endpoints via manual testing or REST client.

## Acceptance Criteria

- [ ] `CategoryModule` with CqrsModule import, forwardRef for Auth/User
- [ ] Repository provided via DI token (`CATEGORY_REPOSITORY` → `CategoryRepository`)
- [ ] All command + query handlers registered as providers
- [ ] Module imported in `AppModule`
- [ ] Barrel export `index.ts`
- [ ] Verify all 6 endpoints work (list, getById, getBySlug, create, update, delete)
- [ ] Verify auth guards work (public reads, admin-only writes)
- [ ] Verify soft delete works (deleted categories excluded from list)

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
