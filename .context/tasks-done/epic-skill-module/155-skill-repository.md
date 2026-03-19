# Task: Skill Module - Repository & Mapper

## Status: done

## Goal

Create Skill repository (Prisma implementation) and mapper with hierarchy-aware queries.

## Context

Extends `ICrudRepository` pattern but adds hierarchy-specific queries: `findChildren()`, `hasChildren()`, `findByCategory()`. Mapper must handle the self-referential relation.

## Acceptance Criteria

- [x] `ISkillRepository` port interface extending `ICrudRepository`
- [x] Additional methods: `findBySlug()`, `findByName()`, `findByCategory()`, `findChildren(parentId)`, `hasChildren(skillId)`
- [x] `PrismaSkillRepository` implementation
- [x] `SkillMapper` — toDomain / toPersistence, handles parentSkillId
- [x] List queries include parent skill name (join)
- [x] Default sort: `displayOrder` ASC then `name` ASC
- [x] Filter support: category, isLibrary, parentSkillId
- [x] Unit tests for mapper
- [x] Integration patterns consistent with Tag/Category repos

## Technical Notes

`findChildren()` returns skills where `parentSkillId = parentId` and `deletedAt IS NULL`.
`hasChildren()` returns boolean — used by delete guard.

## Files to Touch

- libs/shared/types/src/lib/ports/skill-repository.port.ts
- apps/api/src/skill/infrastructure/skill.mapper.ts
- apps/api/src/skill/infrastructure/prisma-skill.repository.ts
- Tests for mapper

## Dependencies

- 154-skill-domain-entity

## Complexity: M

Additional queries beyond CRUD, but follows established patterns.

## Progress Log

- [2026-03-19] Started
- [2026-03-19] Done — all ACs satisfied (5/5 mapper tests passing, tsc clean)
