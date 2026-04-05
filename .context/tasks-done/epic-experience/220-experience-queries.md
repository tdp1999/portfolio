# Task: Experience CQRS queries (list, get-by-id, get-by-slug, list-public)

## Status: done

## Goal
Implement all 4 query handlers for Experience read operations with public/admin response variants and unit tests.

## Context
Experience has two audience contexts: public (landing page, no auth, filtered response) and admin (console, authenticated, full response). The public list query is the main data source for the landing page career timeline.

## Acceptance Criteria

### ListExperiencesQuery (Admin)
- [x] Validates input via `ListExperiencesSchema.safeParse()`
- [x] Calls `repository.findAll(options)` with pagination, search, filters
- [x] Returns `PaginatedResult` with admin response (full fields via `ExperiencePresenter.toAdminListResponse()`)
- [x] Supports filtering by employmentType, locationType
- [x] Supports search across companyName, position (en/vi)
- [x] Supports includeDeleted flag

### GetExperienceByIdQuery (Admin)
- [x] Finds experience by ID via `repository.findById()`
- [x] Throws `NotFoundError` if not found
- [x] Returns admin response (full fields via `ExperiencePresenter.toAdminResponse()`)

### GetExperienceBySlugQuery (Public)
- [x] Finds experience by slug via `repository.findBySlug()`
- [x] Throws `NotFoundError` if not found
- [x] Returns public response (filtered via `ExperiencePresenter.toPublicResponse()`) — excludes private fields (EXP-002)

### ListPublicExperiencesQuery
- [x] No input validation needed (no parameters)
- [x] Calls `repository.findAllPublic()` — non-deleted, sorted displayOrder ASC then startDate DESC (EXP-003)
- [x] Returns public response array (filtered via `ExperiencePresenter.toPublicListResponse()`)
- [x] Includes resolved companyLogoUrl (Media URL) and skills (id, name, slug) per entry

### Unit Tests (experience-queries.spec.ts)
- [x] ListExperiences: returns paginated admin response
- [x] ListExperiences: search filters correctly
- [x] ListExperiences: employmentType filter works
- [x] GetById: found → admin response
- [x] GetById: not found → NotFoundError
- [x] GetBySlug: found → public response (no audit fields, no private location)
- [x] GetBySlug: not found → NotFoundError
- [x] ListPublic: returns sorted array, non-deleted only
- [x] ListPublic: includes skills and companyLogoUrl

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Query section)
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
- [2026-04-04] Started
- [2026-04-04] Done — all ACs satisfied
