# Task: Project CQRS queries

## Status: pending

## Goal
Create all query handlers for Project: admin list, get by ID, get by slug, public list, and featured list.

## Context
Queries handle the read side. Two audiences: admin (all projects, paginated) and public (published only). The featured query powers the landing teaser endpoint.

## Acceptance Criteria
- [ ] `ListProjectsQuery` + handler: admin, paginated, optional status filter, includes drafts + deleted, returns paginated response via Presenter.toAdminResponse
- [ ] `GetProjectByIdQuery` + handler: admin, returns full project via Presenter.toAdminResponse, throws NOT_FOUND
- [ ] `GetProjectBySlugQuery` + handler: public, returns published+non-deleted project via Presenter.toDetail, throws NOT_FOUND
- [ ] `ListPublicProjectsQuery` + handler: no auth, returns published+non-deleted sorted by displayOrder via Presenter.toListItem (PRJ-003)
- [ ] `ListFeaturedProjectsQuery` + handler: no auth, returns featured+published+non-deleted via Presenter.toListItem (PRJ-004)
- [ ] All queries use Presenter for response shaping (never return raw entity)
- [ ] Unit tests for each query handler
- [ ] Queries barrel export in `queries/index.ts`

## Technical Notes
- Follow Skill query pattern: `apps/api/src/modules/skill/application/queries/`
- Admin list supports: `page`, `limit`, `search` (by title), `status` filter
- Public list: no pagination needed (3-4 projects), just return all published sorted by displayOrder
- Featured list: same as public but filtered by `featured: true`

## Files to Touch
- apps/api/src/modules/project/application/queries/list-projects.query.ts (new)
- apps/api/src/modules/project/application/queries/get-project-by-id.query.ts (new)
- apps/api/src/modules/project/application/queries/get-project-by-slug.query.ts (new)
- apps/api/src/modules/project/application/queries/list-public-projects.query.ts (new)
- apps/api/src/modules/project/application/queries/list-featured-projects.query.ts (new)
- apps/api/src/modules/project/application/queries/index.ts (new)
- Spec files for each query handler

## Dependencies
- 227 - Repository port (queries call repo methods)
- 228 - Presenter for response shaping

## Complexity: M

## Progress Log
