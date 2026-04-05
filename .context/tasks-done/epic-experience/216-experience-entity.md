# Task: Experience domain entity + types

## Status: done

## Goal
Create the Experience domain entity with translatable JSON fields, static factories, update/softDelete/restore methods, and comprehensive unit tests.

## Context
Experience extends `BaseCrudEntity<IExperienceProps>` and is the second entity using translatable JSON fields (after Profile). It has ~25 properties including 4 translatable fields. The entity handles slug generation from companyName + position.en with collision suffix support.

## Acceptance Criteria

### Types (experience.types.ts)
- [x] `IExperienceProps` interface with all ~25 fields typed correctly
- [x] Translatable fields typed as `TranslatableString` / `TranslatableStringArray` (from `@portfolio/shared/types`)
- [x] `EmploymentType` and `LocationType` enums (or re-export from Prisma)
- [x] `ICreateExperiencePayload` — fields needed for creation (excludes audit, id, slug)
- [x] `IUpdateExperiencePayload` — partial updatable fields

### Entity (experience.entity.ts)
- [x] Extends `BaseCrudEntity<IExperienceProps>`
- [x] Private constructor
- [x] `static create(data: ICreateExperiencePayload, userId: string): Experience`
  - Generates UUID v7 via `IdentifierValue.v7()`
  - Generates slug from `companyName + data.position.en` via `SlugValue.from()`
  - Sets base audit props via `BaseCrudEntity.createBaseProps(userId)`
  - Sets `displayOrder` default 0, `achievements` default `{ en: [], vi: [] }`
- [x] `static load(props: IExperienceProps): Experience` — hydrates from persistence
- [x] `update(data: IUpdateExperiencePayload, userId: string): Experience` — returns new immutable instance, does NOT update slug (EXP-001: immutable)
- [x] `softDelete(userId: string): Experience` — sets deletedAt/deletedById
- [x] `restore(userId: string): Experience` — clears deletedAt/deletedById
- [x] Getters for all fields (no direct `.props` access from outside)
- [x] `get isCurrent(): boolean` — returns `this.endDate === null`
- [x] `toProps(): IExperienceProps` — used by mapper

### Unit Tests (experience.entity.spec.ts)
- [x] `create()` generates valid UUID v7, slug, audit fields
- [x] `create()` slug from "FPT Software" + "Senior Frontend Engineer" → `fpt-software-senior-frontend-engineer`
- [x] `load()` hydrates all fields correctly
- [x] `update()` returns new instance with updated fields but preserves slug
- [x] `update()` sets updatedAt and updatedById
- [x] `softDelete()` sets deletedAt and deletedById
- [x] `restore()` clears deletedAt and deletedById
- [x] `isCurrent` returns true when endDate is null, false otherwise
- [x] Default achievements is `{ en: [], vi: [] }`

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Entity section)
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
- [2026-04-04] Started — using be-test skill for entity tests
- [2026-04-04] Done — all ACs satisfied, 10/10 tests passed, tsc clean
