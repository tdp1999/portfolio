# Task: Project E2E tests

## Status: pending

## Goal
Write end-to-end tests covering the full Project lifecycle: admin CRUD, public access, featured filtering, and public page rendering.

## Context
E2E validates the complete vertical slice — from admin console form save through public API to public page rendering. Uses existing Playwright + API test patterns.

## Acceptance Criteria

### API E2E — Admin Operations
- [ ] POST `/admin/projects` with full valid payload (including highlights, imageIds, skillIds) → 201
- [ ] POST with missing required translatable field → validation error
- [ ] POST with >4 highlights → validation error (PRJ-002)
- [ ] POST with invalid URLs (sourceUrl, projectUrl, codeUrl) → validation error
- [ ] GET `/admin/projects` → returns paginated list including drafts
- [ ] GET `/admin/projects/:id` → returns full project with nested data
- [ ] PUT `/admin/projects/:id` → updates project, children replaced (PRJ-005)
- [ ] PUT with title change → slug regenerated
- [ ] DELETE `/admin/projects/:id` → soft deletes
- [ ] POST `/admin/projects/:id/restore` → restores
- [ ] PATCH `/admin/projects/reorder` → updates displayOrder

### API E2E — Public Access
- [ ] GET `/projects` without auth → returns only published + non-deleted (PRJ-003)
- [ ] GET `/projects` response sorted by displayOrder
- [ ] GET `/projects/featured` → returns only featured + published (PRJ-004)
- [ ] GET `/projects/:slug` → returns full detail with highlights, images, skills
- [ ] GET `/projects/:slug` for draft project → 404
- [ ] GET `/projects/:slug` for deleted project → 404
- [ ] GET `/projects/nonexistent` → 404

### Console E2E
- [ ] Navigate to Projects page → list visible
- [ ] Create project via dialog → appears in list
- [ ] Edit project → changes reflected
- [ ] Delete project → moved to trash
- [ ] Restore from trash → back in list

### Public Page E2E
- [ ] `/projects` page renders with project rows
- [ ] Click project row → navigates to `/projects/:slug`
- [ ] Detail page renders: title, motivation, overview, highlights, images
- [ ] Locale switch → translatable fields update

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
