# Task: Skill Module - Commands & Handlers

## Status: done

## Goal

Implement CQRS commands for Skill: Create, Update, Delete, Restore.

## Context

Delete handler must check `hasChildren()` before allowing soft delete. Create/Update must validate parent hierarchy. Follows Category command pattern but with hierarchy guards.

## Acceptance Criteria

- [x] `CreateSkillCommand` + handler: validates unique name/slug, validates parent (if provided) exists and is not itself a child, creates entity
- [x] `UpdateSkillCommand` + handler: validates unique name/slug (excluding self), validates parent change if applicable
- [x] `DeleteSkillCommand` + handler: checks `hasChildren()` — rejects with `SKILL_HAS_CHILDREN` if true, then soft deletes
- [x] `RestoreSkillCommand` + handler: restores soft-deleted skill, validates parent still valid
- [x] Error codes: `SKILL_NOT_FOUND`, `SKILL_NAME_TAKEN`, `SKILL_HAS_CHILDREN`, `SKILL_ALREADY_DELETED`, `SKILL_CIRCULAR_REFERENCE`, `SKILL_MAX_DEPTH_EXCEEDED`, `SKILL_PARENT_DELETED`
- [x] Unit tests for each handler (TDD), especially hierarchy edge cases
- [x] Slug auto-generated from name

## Technical Notes

Delete guard logic:
```typescript
if (await this.skillRepo.hasChildren(skillId)) {
  throw SKILL_HAS_CHILDREN
}
```

Parent validation in create/update:
```typescript
if (parentSkillId) {
  const parent = await this.skillRepo.findById(parentSkillId)
  if (!parent) throw SKILL_NOT_FOUND
  if (parent.deletedAt) throw SKILL_PARENT_DELETED
  if (parent.parentSkillId) throw SKILL_MAX_DEPTH_EXCEEDED
}
```

## Files to Touch

- apps/api/src/skill/application/commands/
- apps/api/src/skill/application/commands/handlers/
- Tests for each handler

## Dependencies

- 155-skill-repository
- 156-skill-dtos

## Complexity: L

Most complex commands due to hierarchy validation in create/update/delete.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied (25/25 tests passing)
