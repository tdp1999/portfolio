# Task: Experience CQRS queries (list, get-by-id, get-by-slug, list-public)

## Status: pending

## Goal
Implement all 4 query handlers for Experience read operations with public/admin response variants and unit tests.

## Context
Experience has two audience contexts: public (landing page, no auth, filtered response) and admin (console, authenticated, full response). The public list query is the main data source for the landing page career timeline.

## Acceptance Criteria

### ListExperiencesQuery (Admin)
- [ ] Validates input via `ListExperiencesSchema.safeParse()`
- [ ] Calls `repository.findAll(options)` with pagination, search, filters
- [ ] Returns `PaginatedResult` with admin response (full fields via `ExperiencePresenter.toAdminListResponse()`)
- [ ] Supports filtering by employmentType, locationType
- [ ] Supports search across companyName, position (en/vi)
- [ ] Supports includeDeleted flag

### GetExperienceByIdQuery (Admin)
- [ ] Finds experience by ID via `repository.findById()`
- [ ] Throws `NotFoundError` if not found
- [ ] Returns admin response (full fields via `ExperiencePresenter.toAdminResponse()`)

### GetExperienceBySlugQuery (Public)
- [ ] Finds experience by slug via `repository.findBySlug()`
- [ ] Throws `NotFoundError` if not found
- [ ] Returns public response (filtered via `ExperiencePresenter.toPublicResponse()`) — excludes private fields (EXP-002)

### ListPublicExperiencesQuery
- [ ] No input validation needed (no parameters)
- [ ] Calls `repository.findAllPublic()` — non-deleted, sorted displayOrder ASC then startDate DESC (EXP-003)
- [ ] Returns public response array (filtered via `ExperiencePresenter.toPublicListResponse()`)
- [ ] Includes resolved companyLogoUrl (Media URL) and skills (id, name, slug) per entry

### Unit Tests (experience-queries.spec.ts)
- [ ] ListExperiences: returns paginated admin response
- [ ] ListExperiences: search filters correctly
- [ ] ListExperiences: employmentType filter works
- [ ] GetById: found → admin response
- [ ] GetById: not found → NotFoundError
- [ ] GetBySlug: found → public response (no audit fields, no private location)
- [ ] GetBySlug: not found → NotFoundError
- [ ] ListPublic: returns sorted array, non-deleted only
- [ ] ListPublic: includes skills and companyLogoUrl

## Technical Notes
- **Specialized Skill:** `be-test` — **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Query section)
- Follow Skill queries pattern as reference
- Public vs admin response: the Presenter handles field filtering, not the repository
- `findAllPublic()` should eager-load skills and companyLogo in one query to avoid N+1
- Sort order for public: `ORDER BY displayOrder ASC, startDate DESC` — entries with displayOrder > 0 appear first in manual order, then remaining by date

## Files to Touch
- New: `apps/api/src/modules/experience/application/queries/list-experiences.handler.ts`
- New: `apps/api/src/modules/experience/application/queries/get-experience-by-id.handler.ts`
- New: `apps/api/src/modules/experience/application/queries/get-experience-by-slug.handler.ts`
- New: `apps/api/src/modules/experience/application/queries/list-public-experiences.handler.ts`
- New: `apps/api/src/modules/experience/application/queries/index.ts`
- New: `apps/api/src/modules/experience/application/queries/experience-queries.spec.ts`

## Dependencies
- 217 (Repository)
- 218 (DTOs + Presenter)

## Complexity: M

## Progress Log
