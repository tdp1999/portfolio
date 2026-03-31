# Task: Project CQRS commands

## Status: pending

## Goal
Create all command handlers for Project: create, update, delete (soft), restore, and reorder.

## Context
Commands handle the write side. Create and Update are the most complex — they validate DTOs, manage the entity, and orchestrate nested writes (highlights, images, skills) via the repository. Slug collision detection happens here.

## Acceptance Criteria
- [ ] `CreateProjectCommand` + handler: validate DTO, create entity, check slug uniqueness (append -2/-3 on collision per PRJ-001), call repo.create with nested data
- [ ] `UpdateProjectCommand` + handler: validate DTO, load existing, update entity (regenerate slug if title changed), check slug uniqueness, call repo.update (PRJ-005: replace-all children)
- [ ] `DeleteProjectCommand` + handler: load entity, soft delete, save
- [ ] `RestoreProjectCommand` + handler: load deleted entity, restore, save
- [ ] `ReorderProjectsCommand` + handler: accept `{ id, displayOrder }[]`, call repo.batchUpdateOrder
- [ ] All commands validate via Zod `safeParse` — throw `BadRequestError` on failure
- [ ] NOT_FOUND error when entity doesn't exist (load operations)
- [ ] SLUG_CONFLICT only if collision resolution fails (unlikely but handle)
- [ ] Highlights count validated ≤ 4 (PRJ-002)
- [ ] Media IDs validated (thumbnailId, imageIds) — existence check or let FK fail?
- [ ] Skill IDs validated — existence check or let FK fail?
- [ ] Unit tests for each command handler (happy path + error cases)
- [ ] Commands barrel export in `commands/index.ts`

## Technical Notes
- Follow Skill command pattern: `apps/api/src/modules/skill/application/commands/`
- Slug collision: `repo.slugExists(slug, excludeId)` → if exists, try `slug-2`, `slug-3`, up to `slug-10`
- For Media/Skill FK validation: let Prisma FK constraint fail and catch in repo — simpler than pre-checking. Wrap in try/catch with meaningful error.
- All commands pass `userId` from auth context for audit fields

## Files to Touch
- apps/api/src/modules/project/application/commands/create-project.command.ts (new)
- apps/api/src/modules/project/application/commands/update-project.command.ts (new)
- apps/api/src/modules/project/application/commands/delete-project.command.ts (new)
- apps/api/src/modules/project/application/commands/restore-project.command.ts (new)
- apps/api/src/modules/project/application/commands/reorder-projects.command.ts (new)
- apps/api/src/modules/project/application/commands/index.ts (new)
- Spec files for each command handler

## Dependencies
- 226 - Entity
- 227 - Repository port
- 228 - DTOs for validation

## Complexity: L
- 5 command handlers, slug collision logic, nested write orchestration

## Progress Log
