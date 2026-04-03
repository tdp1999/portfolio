# Task: Experience CQRS commands (create, update, delete, restore, reorder)

## Status: pending

## Goal
Implement all 5 command handlers for Experience CRUD operations with full validation, slug generation, skills management, and unit tests.

## Context
Experience commands follow established CQRS pattern. Key complexities: slug generation with collision handling, ExperienceSkill junction replacement on update, skill ID validation against existing Skill records, and company logo Media validation.

## Acceptance Criteria

### CreateExperienceCommand
- [ ] Validates input via `CreateExperienceSchema.safeParse()` — throws `ValidationError` on failure
- [ ] Generates slug from `companyName + position.en` via `SlugValue.from()`
- [ ] Handles slug collision: checks `slugExists()`, appends `-2`, `-3` suffix until unique (EXP-001)
- [ ] Validates `skillIds` exist in Skill repository (rejects unknown IDs)
- [ ] Validates `companyLogoId` exists in Media (if provided)
- [ ] Creates Experience entity via `Experience.create()`
- [ ] Calls `repository.add(entity, skillIds)` — persists entity + junction rows
- [ ] Returns created experience ID

### UpdateExperienceCommand
- [ ] Validates input via `UpdateExperienceSchema.safeParse()`
- [ ] Finds existing experience by ID — throws `NotFoundError` if not found
- [ ] Does NOT update slug (EXP-001: immutable after creation)
- [ ] Validates `skillIds` if provided
- [ ] Validates `companyLogoId` if provided
- [ ] Updates entity via `entity.update(data, userId)`
- [ ] Calls `repository.update(id, entity, skillIds)` — replaces junction rows (EXP-006)

### DeleteExperienceCommand
- [ ] Finds existing experience by ID — throws `NotFoundError` if not found
- [ ] Soft deletes via `entity.softDelete(userId)`
- [ ] Calls `repository.remove(id, entity)`

### RestoreExperienceCommand
- [ ] Finds experience by ID (must use includeDeleted option) — throws `NotFoundError` if not found
- [ ] Throws error if entity is not soft-deleted (nothing to restore)
- [ ] Restores via `entity.restore(userId)`
- [ ] Calls `repository.restore(id, entity)`

### ReorderExperiencesCommand
- [ ] Validates input via `ReorderExperiencesSchema.safeParse()`
- [ ] Calls `repository.reorder(items)` — bulk updates displayOrder

### Unit Tests (experience-commands.spec.ts)
- [ ] Create: valid input → entity created, ID returned
- [ ] Create: slug collision → appends numeric suffix
- [ ] Create: invalid skillIds → ValidationError
- [ ] Create: invalid companyLogoId → NotFoundError
- [ ] Update: valid → entity updated, slug unchanged
- [ ] Update: not found → NotFoundError
- [ ] Delete: valid → soft delete applied
- [ ] Delete: not found → NotFoundError
- [ ] Restore: valid → deletedAt cleared
- [ ] Restore: not deleted → error
- [ ] Reorder: valid → displayOrder updated

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
