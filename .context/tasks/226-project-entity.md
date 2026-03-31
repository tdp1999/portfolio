# Task: Project domain entity

## Status: pending

## Goal
Create the Project domain entity with create/update/soft-delete methods, slug generation, and validation.

## Context
Domain entity for the Project aggregate. Extends BaseCrudEntity pattern. Includes slug auto-generation from title (using existing SlugValue), soft delete/restore, and featured toggle. Entity owns 4 translatable JSON fields but does NOT manage child records (highlights, images, skills) — those are managed at the command handler level.

## Acceptance Criteria
- [ ] `Project` entity class extending `BaseCrudEntity` with all properties
- [ ] `IProjectProps` interface in `project.types.ts` (separate file per code style rule)
- [ ] `static create(data, userId)` — generates slug from title via `SlugValue.from(title)`, sets defaults
- [ ] `update(data, userId)` — updates fields, regenerates slug if title changed
- [ ] `softDelete(userId)` / `restore(userId)` methods
- [ ] `toggleFeatured()` method
- [ ] Public getters for all properties
- [ ] `get isPublished()` convenience accessor (`status === PUBLISHED && !isDeleted`)
- [ ] `ProjectErrorCode` enum in `project.error.ts` (NOT_FOUND, SLUG_CONFLICT, MAX_HIGHLIGHTS_EXCEEDED)
- [ ] Unit tests: create with valid data, slug generation, update regenerates slug, soft delete/restore, featured toggle
- [ ] PRJ-002: Entity does NOT enforce max highlights (that's at command level) — but types document it

## Technical Notes
- Follow `Skill` entity pattern: `apps/api/src/modules/skill/domain/entities/skill.entity.ts`
- Use `SlugValue.from(title)` from `@portfolio/shared/types`
- Use `BaseCrudEntity.createBaseProps(userId)` for audit fields
- Types file separate from entity: `project.types.ts` for `IProjectProps`, `ICreateProjectPayload`, `IUpdateProjectPayload`
- ContentStatus imported from Prisma client

## Files to Touch
- apps/api/src/modules/project/domain/entities/project.entity.ts (new)
- apps/api/src/modules/project/domain/entities/project.entity.spec.ts (new)
- apps/api/src/modules/project/domain/project.types.ts (new)
- apps/api/src/modules/project/domain/project.error.ts (new)

## Dependencies
- 225 - Schema must exist for type imports

## Complexity: M

## Progress Log
