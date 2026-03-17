# Task: Category Module - E2E Tests

## Status: done

## Goal

Create Playwright E2E tests covering the full Category CRUD flow.

## Context

Follows the Tag E2E test pattern (`tag-crud.spec.ts`). Tests the complete user journey through the admin dashboard.

## Acceptance Criteria

- [x] Test file: `apps/console-e2e/src/category-crud.spec.ts`
- [x] Page object: `CategoryPage` (or similar helper)
- [x] **Create flow:** Fill form → submit → verify appears in table
- [x] **Read flow:** Verify list displays categories, search filters correctly, pagination works
- [x] **Update flow:** Edit name/description/displayOrder → verify changes persist
- [x] **Delete flow:** Soft delete via confirm dialog → verify removed from list
- [x] **Validation:** Empty name rejected, duplicate name shows error
- [x] **Auth guard:** Unauthenticated user cannot access write operations
- [x] Test helpers: `createTestCategory()`, `deleteTestCategories()` for setup/teardown
- [x] Console/network monitoring for errors (Playwright best practices)

## Technical Notes

Follow `tag-crud.spec.ts` pattern and POM (Page Object Model). Use `aqa-expert` skill patterns for robust tests.

Ensure test isolation — each test creates its own data and cleans up.

## Files to Touch

- apps/console-e2e/src/category-crud.spec.ts
- apps/console-e2e/src/helpers/ (test helpers if needed)

## Dependencies

- 151-category-fe-library (FE must be complete)

## Complexity: M

E2E tests following established pattern.

## Progress Log
- [2026-03-17] Started
- [2026-03-17] Done — all ACs satisfied, 16/16 tests passing
