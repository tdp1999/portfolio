# Task: Project CQRS queries

## Status: done

## Goal
Create all query handlers for Project: admin list, get by ID, get by slug, public list, and featured list.

## Context
Queries handle the read side. Two audiences: admin (all projects, paginated) and public (published only). The featured query powers the landing teaser endpoint.

## Acceptance Criteria
- [x] `ListProjectsQuery` + handler: admin, paginated, optional status filter, includes drafts + deleted, returns paginated response via Presenter.toAdminResponse
- [x] `GetProjectByIdQuery` + handler: admin, returns full project via Presenter.toAdminResponse, throws NOT_FOUND
- [x] `GetProjectBySlugQuery` + handler: public, returns published+non-deleted project via Presenter.toDetail, throws NOT_FOUND
- [x] `ListPublicProjectsQuery` + handler: no auth, returns published+non-deleted sorted by displayOrder via Presenter.toListItem (PRJ-003)
- [x] `ListFeaturedProjectsQuery` + handler: no auth, returns featured+published+non-deleted via Presenter.toListItem (PRJ-004)
- [x] All queries use Presenter for response shaping (never return raw entity)
- [x] Unit tests for each query handler
- [x] Queries barrel export in `queries/index.ts`

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
- [2026-04-05] Started
- [2026-04-05] Done — 5 query handlers (list admin, by ID, by slug, public, featured) with Presenter shaping, barrel export
