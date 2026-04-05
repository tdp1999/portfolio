# Task: Experience CQRS commands (create, update, delete, restore, reorder)

## Status: done

## Goal
Implement all 5 command handlers for Experience CRUD operations with full validation, slug generation, skills management, and unit tests.

## Context
Experience commands follow established CQRS pattern. Key complexities: slug generation with collision handling, ExperienceSkill junction replacement on update, skill ID validation against existing Skill records, and company logo Media validation.

## Acceptance Criteria

### CreateExperienceCommand
- [x] Validates input via `CreateExperienceSchema.safeParse()` — throws `ValidationError` on failure
- [x] Generates slug from `companyName + position.en` via `SlugValue.from()`
- [x] Handles slug collision: checks `slugExists()`, appends `-2`, `-3` suffix until unique (EXP-001)
- [x] Validates `skillIds` exist in Skill repository (rejects unknown IDs)
- [x] Validates `companyLogoId` exists in Media (if provided)
- [x] Creates Experience entity via `Experience.create()`
- [x] Calls `repository.add(entity, skillIds)` — persists entity + junction rows
- [x] Returns created experience ID

### UpdateExperienceCommand
- [x] Validates input via `UpdateExperienceSchema.safeParse()`
- [x] Finds existing experience by ID — throws `NotFoundError` if not found
- [x] Does NOT update slug (EXP-001: immutable after creation)
- [x] Validates `skillIds` if provided
- [x] Validates `companyLogoId` if provided
- [x] Updates entity via `entity.update(data, userId)`
- [x] Calls `repository.update(id, entity, skillIds)` — replaces junction rows (EXP-006)

### DeleteExperienceCommand
- [x] Finds existing experience by ID — throws `NotFoundError` if not found
- [x] Soft deletes via `entity.softDelete(userId)`
- [x] Calls `repository.remove(id, entity)`

### RestoreExperienceCommand
- [x] Finds experience by ID (must use includeDeleted option) — throws `NotFoundError` if not found
- [x] Throws error if entity is not soft-deleted (nothing to restore)
- [x] Restores via `entity.restore(userId)`
- [x] Calls `repository.restore(id, entity)`

### ReorderExperiencesCommand
- [x] Validates input via `ReorderExperiencesSchema.safeParse()`
- [x] Calls `repository.reorder(items)` — bulk updates displayOrder

### Unit Tests (experience-commands.spec.ts)
- [x] Create: valid input → entity created, ID returned
- [x] Create: slug collision → appends numeric suffix
- [x] Create: invalid skillIds → ValidationError
- [x] Create: invalid companyLogoId → NotFoundError
- [x] Update: valid → entity updated, slug unchanged
- [x] Update: not found → NotFoundError
- [x] Delete: valid → soft delete applied
- [x] Delete: not found → NotFoundError
- [x] Restore: valid → deletedAt cleared
- [x] Restore: not deleted → error
- [x] Reorder: valid → displayOrder updated

## Technical Notes
- **Specialized Skill:** `be-test` — read `.claude/skills/be-test/SKILL.md` for guidelines. **Key sections to read:** `Core Workflow: Analyze -> Plan -> Write -> Validate`, `references/layer-rules.md` (Command section)
- Follow Skill commands pattern as reference (`apps/api/src/modules/skill/application/commands/`)
- Slug collision handling: simple loop `while (await repo.slugExists(candidate)) { candidate = base + '-' + counter++ }`
- Skill validation: inject `SKILL_REPOSITORY` or use `SkillModule` export. Check all IDs exist in one query.
- CompanyLogo validation: inject `MEDIA_REPOSITORY` or use `MediaModule` export. Check exists.
- All errors use `ExperienceErrorCode` from shared/errors

## Files to Touch
- New: `apps/api/src/modules/experience/application/commands/create-experience.handler.ts`
- New: `apps/api/src/modules/experience/application/commands/update-experience.handler.ts`
- New: `apps/api/src/modules/experience/application/commands/delete-experience.handler.ts`
- New: `apps/api/src/modules/experience/application/commands/restore-experience.handler.ts`
- New: `apps/api/src/modules/experience/application/commands/reorder-experiences.handler.ts`
- New: `apps/api/src/modules/experience/application/commands/index.ts`
- New: `apps/api/src/modules/experience/application/commands/experience-commands.spec.ts`

## Dependencies
- 216 (Domain entity)
- 217 (Repository port)
- 218 (DTOs for validation schemas)

## Complexity: L

## Progress Log
- [2026-04-04] Started
- [2026-04-04] Done — all ACs satisfied
