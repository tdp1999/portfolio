# Task: Skill Module - Zod DTOs

## Status: done

## Goal

Create Zod v4 validation schemas for Skill create, update, and query DTOs.

## Context

More fields than Category DTOs. Must validate `category` as enum, `parentSkillId` as optional UUID, and boolean fields.

## Acceptance Criteria

- [x] `CreateSkillDto` — required: name, category; optional: description, isLibrary, parentSkillId, yearsOfExperience, iconUrl, proficiencyNote, isFeatured, displayOrder
- [x] `UpdateSkillDto` — all fields optional (partial of create)
- [x] `SkillQueryDto` — pagination + filters: category, isLibrary, parentSkillId, search
- [x] Zod v4 syntax (e.g., `z.email()` not `z.string().email()`)
- [x] `SkillCategory` Zod enum matching Prisma enum
- [x] Proper coercion for query params (string → boolean, string → number)
- [x] Unit tests for validation edge cases
- [x] Exported from shared types

## Technical Notes

Follow Category DTO patterns. Use `z.enum()` for SkillCategory.

## Files to Touch

- libs/shared/types/src/lib/dtos/skill.dto.ts
- libs/shared/types/src/lib/dtos/skill.dto.spec.ts
- libs/shared/types/src/lib/dtos/index.ts (export)

## Dependencies

- 153-skill-prisma-schema (enum values)

## Complexity: S

More fields but straightforward Zod schemas.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied (29/29 tests passing)
