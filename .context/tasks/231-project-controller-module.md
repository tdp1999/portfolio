# Task: Project controller and NestJS module wiring

## Status: pending

## Goal
Create the Project controller (public + admin endpoints) and wire up the NestJS module with all providers.

## Context
Controller is a thin transport adapter — no validation, no error throwing, just dispatch to command/query bus. Two route groups: `/projects` (public, no auth) and `/admin/projects` (JWT + ADMIN guard). Module registers all providers and imports.

## Acceptance Criteria
- [ ] Public endpoints (no auth):
  - `GET /projects` → dispatches ListPublicProjectsQuery
  - `GET /projects/featured` → dispatches ListFeaturedProjectsQuery
  - `GET /projects/:slug` → dispatches GetProjectBySlugQuery
- [ ] Admin endpoints (JWT + ADMIN):
  - `GET /admin/projects` → dispatches ListProjectsQuery (with pagination params)
  - `GET /admin/projects/:id` → dispatches GetProjectByIdQuery
  - `POST /admin/projects` → dispatches CreateProjectCommand (body as unknown)
  - `PUT /admin/projects/:id` → dispatches UpdateProjectCommand (body as unknown)
  - `DELETE /admin/projects/:id` → dispatches DeleteProjectCommand
  - `POST /admin/projects/:id/restore` → dispatches RestoreProjectCommand
  - `PATCH /admin/projects/reorder` → dispatches ReorderProjectsCommand
- [ ] Controller is thin — no validation, no error throwing, no business logic
- [ ] `ProjectModule` registers: controller, all command handlers, all query handlers, repository provider (token → adapter)
- [ ] Module imports: `CqrsModule`, `PrismaModule`
- [ ] Module registered in `AppModule`
- [ ] Smoke test: endpoints respond (manual or integration test)

## Technical Notes
- Follow Skill controller pattern: `apps/api/src/modules/skill/presentation/skill.controller.ts`
- Follow Skill module pattern: `apps/api/src/modules/skill/skill.module.ts`
- Use `@UseGuards(JwtAuthGuard, AdminGuard)` on admin controller
- `GET /projects/featured` must be defined BEFORE `GET /projects/:slug` to avoid route collision
- Extract userId from request: `@Req() req` → `req.user.id` for commands

## Files to Touch
- apps/api/src/modules/project/presentation/project.controller.ts (new)
- apps/api/src/modules/project/project.module.ts (new)
- apps/api/src/modules/project/index.ts (new)
- apps/api/src/app.module.ts (register ProjectModule)

## Dependencies
- 229 - Commands
- 230 - Queries

## Complexity: M

## Progress Log
