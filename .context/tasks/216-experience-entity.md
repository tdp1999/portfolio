# Task: Experience domain entity + types

## Status: pending

## Goal
Create the Experience domain entity with translatable JSON fields, static factories, update/softDelete/restore methods, and comprehensive unit tests.

## Context
Experience extends `BaseCrudEntity<IExperienceProps>` and is the second entity using translatable JSON fields (after Profile). It has ~25 properties including 4 translatable fields. The entity handles slug generation from companyName + position.en with collision suffix support.

## Acceptance Criteria

### Types (experience.types.ts)
- [ ] `IExperienceProps` interface with all ~25 fields typed correctly
- [ ] Translatable fields typed as `TranslatableString` / `TranslatableStringArray` (from `@portfolio/shared/types`)
- [ ] `EmploymentType` and `LocationType` enums (or re-export from Prisma)
- [ ] `ICreateExperiencePayload` — fields needed for creation (excludes audit, id, slug)
- [ ] `IUpdateExperiencePayload` — partial updatable fields

### Entity (experience.entity.ts)
- [ ] Extends `BaseCrudEntity<IExperienceProps>`
- [ ] Private constructor
- [ ] `static create(data: ICreateExperiencePayload, userId: string): Experience`
  - Generates UUID v7 via `IdentifierValue.v7()`
  - Generates slug from `companyName + data.position.en` via `SlugValue.from()`
  - Sets base audit props via `BaseCrudEntity.createBaseProps(userId)`
  - Sets `displayOrder` default 0, `achievements` default `{ en: [], vi: [] }`
- [ ] `static load(props: IExperienceProps): Experience` — hydrates from persistence
- [ ] `update(data: IUpdateExperiencePayload, userId: string): Experience` — returns new immutable instance, does NOT update slug (EXP-001: immutable)
- [ ] `softDelete(userId: string): Experience` — sets deletedAt/deletedById
- [ ] `restore(userId: string): Experience` — clears deletedAt/deletedById
- [ ] Getters for all fields (no direct `.props` access from outside)
- [ ] `get isCurrent(): boolean` — returns `this.endDate === null`
- [ ] `toProps(): IExperienceProps` — used by mapper

### Unit Tests (experience.entity.spec.ts)
- [ ] `create()` generates valid UUID v7, slug, audit fields
- [ ] `create()` slug from "FPT Software" + "Senior Frontend Engineer" → `fpt-software-senior-frontend-engineer`
- [ ] `load()` hydrates all fields correctly
- [ ] `update()` returns new instance with updated fields but preserves slug
- [ ] `update()` sets updatedAt and updatedById
- [ ] `softDelete()` sets deletedAt and deletedById
- [ ] `restore()` clears deletedAt and deletedById
- [ ] `isCurrent` returns true when endDate is null, false otherwise
- [ ] Default achievements is `{ en: [], vi: [] }`

## Technical Notes
- **Specialized Skill:** `be-test` — **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Entity section)
- Follow Skill entity pattern as reference (`apps/api/src/modules/skill/domain/entities/skill.entity.ts`)
- Slug is immutable (EXP-001) — `update()` method must NOT regenerate slug even if companyName or position changes
- `TranslatableString` and `TranslatableStringArray` shared types must exist (from Profile epic, task 206). If not yet available, define locally and refactor when shared types land.
- `EmploymentType` and `LocationType` can be re-exported from `@prisma/client` or defined as domain enums mirroring Prisma

## Files to Touch
- New: `apps/api/src/modules/experience/domain/entities/experience.entity.ts`
- New: `apps/api/src/modules/experience/domain/entities/experience.entity.spec.ts`
- New: `apps/api/src/modules/experience/domain/experience.types.ts`
- Update: `libs/shared/errors/src/lib/error-codes/` — add `ExperienceErrorCode` enum

## Dependencies
- 215 (Prisma schema must exist for type reference)

## Complexity: M

## Progress Log
