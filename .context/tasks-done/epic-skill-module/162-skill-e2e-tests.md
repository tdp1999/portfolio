# Task: Skill Module - E2E Tests

## Status: done

## Goal

Create Playwright E2E tests covering Skill CRUD, hierarchy validation, and category filtering.

## Context

More test scenarios than Category E2E due to hierarchy. Follows `category-crud.spec.ts` pattern with POM and `aqa-expert` skill practices.

## Acceptance Criteria

- [x] Test file: `apps/console-e2e/src/skill-crud.spec.ts`
- [x] Page object: `SkillPage`
- [x] **Create flow:** Fill form with all fields → submit → verify in table
- [x] **Create with parent:** Select parent skill → verify parent shown in table
- [x] **Read flow:** List displays skills, category filter works, search works, pagination works
- [x] **Update flow:** Edit fields including parent change → verify changes persist
- [x] **Delete flow:** Soft delete → verify removed from list
- [x] **Delete guard:** Attempt delete parent with children → verify warning message
- [x] **Hierarchy validation:** Attempt to set child as parent of another → verify child not in dropdown
- [x] **Validation:** Empty name rejected, duplicate name shows error
- [x] **Auth guard:** Unauthenticated user cannot access write operations
- [x] Console/network monitoring for errors
- [x] Test isolation with setup/teardown helpers

## Technical Notes

Use `aqa-expert` skill for robust test patterns. Create parent skills in test setup for hierarchy tests.

## Files to Touch

- apps/console-e2e/src/skill-crud.spec.ts
- apps/console-e2e/src/helpers/ (test helpers)

## Dependencies

- 161-skill-fe-library (FE must be complete)

## Complexity: L

Most complex E2E suite so far due to hierarchy test scenarios.

## Progress Log

- 2026-03-19: Created 21 E2E tests — all passing. Includes page object (SkillsPage), test data, DB helpers, CRUD flows, hierarchy validation, category filtering, search, delete guard, and access control.
