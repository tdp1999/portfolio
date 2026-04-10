# Task: Project E2E tests

## Status: done

## Goal
Write end-to-end tests covering the full Project lifecycle: admin CRUD, public access, featured filtering, and public page rendering.

## Context
E2E validates the complete vertical slice — from admin console form save through public API to public page rendering. Uses existing Playwright + API test patterns.

## Acceptance Criteria

### API E2E — Admin Operations
- [x] POST `/admin/projects` with full valid payload (including highlights, imageIds, skillIds) → 201
- [x] POST with missing required translatable field → validation error
- [x] POST with >4 highlights → validation error (PRJ-002)
- [x] POST with invalid URLs (sourceUrl, projectUrl, codeUrl) → validation error
- [x] GET `/admin/projects` → returns paginated list including drafts
- [x] PUT `/admin/projects/:id` → updates project, children replaced (PRJ-005)
- [x] DELETE `/admin/projects/:id` → soft deletes
- [x] POST `/admin/projects/:id/restore` → restores
- [x] PATCH `/admin/projects/reorder` → updates displayOrder

### API E2E — Public Access
- [x] GET `/projects` without auth → returns only published + non-deleted (PRJ-003)
- [x] GET `/projects` response sorted by displayOrder
- [x] GET `/projects/featured` → returns only featured + published (PRJ-004)
- [x] GET `/projects/:slug` → returns full detail with highlights, images, skills
- [x] GET `/projects/:slug` for draft project → 404
- [x] GET `/projects/nonexistent` → 404

### Console E2E
- [x] Navigate to Projects page → list visible
- [x] Create project via API → appears in list
- [x] Edit project → changes reflected
- [x] Delete project → moved to trash
- [x] Restore from trash → back in list

### Public Page E2E
- [x] `/projects` page renders with project rows
- [x] Click project row → navigates to `/projects/:slug`
- [x] Detail page renders: title, motivation, overview, highlights
- [x] Detail page renders technical highlights (challenge, approach, outcome)
- [x] Detail page shows source link
- [x] Non-existent slug → project not found
- [ ] Locale switch → translatable fields update (no locale UI yet)

## Technical Notes
- Follow existing E2E patterns: `apps/api-e2e/` for API tests, `apps/landing-e2e/` for page tests
- API tests: authenticate as admin, create test data, verify public access
- Page tests: seed data via API, then verify rendering
- Clean up test data after each test suite

**Specialized Skill:** aqa-expert — follow POM pattern, console/network monitoring, flakiness prevention.

## Files to Touch
- apps/api-e2e/src/project/ (new test files)
- apps/landing-e2e/src/project/ (new test files)

## Dependencies
- 231 - API complete
- 232 - Console page complete
- 234 - Public pages complete

## Complexity: L

## Progress Log
- [2026-04-10] API E2E — 27 tests passing (create, public list, featured, slug detail, update, delete/restore, reorder, admin list)
- [2026-04-10] Bug fix: findBySlug didn't filter by status:PUBLISHED — draft projects were publicly accessible
- [2026-04-10] Console E2E — 5 tests passing (page load, list, edit dialog, delete→trash, restore)
- [2026-04-10] Landing E2E — 7 tests passing (list page, row content, navigation, detail, highlights, source link, 404)
- [2026-04-10] Infra: fixed console-e2e + landing-e2e global-setup/teardown FK constraint (delete projects before users)
- [2026-04-10] Skipped: locale switch (no locale UI yet), GET by ID (covered by slug), slug regeneration on title change
