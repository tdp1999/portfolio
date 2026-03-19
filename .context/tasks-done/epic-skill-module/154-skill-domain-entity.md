# Task: Skill Module - Domain Entity

## Status: done

## Goal

Create Skill domain entity with hierarchy validation (max 1-level depth, no circular references).

## Context

Extends `BaseCrudEntity` pattern from Tag/Category but adds parent-child hierarchy logic. Key difference: `assignParent()` and `removeParent()` methods with validation that parent cannot itself be a child.

## Acceptance Criteria

- [x] `Skill` entity extending `BaseCrudEntity` pattern
- [x] Static `create()` factory with required fields: name, slug, category, createdById
- [x] Static `load()` for hydration from persistence
- [x] `update()` method for mutable fields
- [x] `softDelete()` and `restore()` methods
- [x] `assignParent(parentId, parentHasParent)` — rejects if parent itself has a parent (max 1 level)
- [x] `removeParent()` — clears parentSkillId
- [x] Self-reference guard: cannot assign self as parent
- [x] All value objects / validation: name non-empty, slug format, category valid enum
- [x] Domain error codes: `SKILL_CIRCULAR_REFERENCE`, `SKILL_MAX_DEPTH_EXCEEDED`, `SKILL_PARENT_DELETED`
- [x] Unit tests with full coverage (TDD: red → green → refactor)

## Technical Notes

Key hierarchy validation in `assignParent()`:
```typescript
if (parentId === this.id) throw SKILL_CIRCULAR_REFERENCE
if (parentHasParent) throw SKILL_MAX_DEPTH_EXCEEDED  // parent is already a child
```

Follow Category entity patterns for create/load/update/softDelete/restore.

## Files to Touch

- libs/shared/types/src/lib/domain/skill.entity.ts
- libs/shared/types/src/lib/domain/skill.entity.spec.ts
- libs/shared/types/src/lib/domain/index.ts (export)

## Dependencies

- 153-skill-prisma-schema (enum type needed)

## Complexity: M

Entity logic is more complex than Category due to hierarchy validation.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied (18/18 tests passing)
