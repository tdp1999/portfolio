# Task: Media Domain Entity + Tests

## Status: done

## Goal
Create the Media domain entity with factory methods, value validation, and full test coverage.

## Context
Domain entity encapsulates media business rules. Immutable file data after creation; only altText/caption are editable.

## Acceptance Criteria
- [x] `Media` entity extends `BaseCrudEntity` with all schema fields
- [x] `create()` static factory — accepts upload result + metadata, returns new entity
- [x] `load()` static factory — reconstitutes from persistence
- [x] `updateMetadata(altText, caption, updatedById)` — only mutable fields
- [x] `softDelete(deletedById)` — sets deletedAt/deletedById, throws if already deleted
- [x] `restore()` — clears deletedAt/deletedById, throws if not deleted
- [x] Domain types file with `MediaProps`, `CreateMediaProps`
- [x] Unit tests: create, load, updateMetadata, softDelete, restore, error cases
- [x] TDD approach: write tests first

## Technical Notes
- Follow Skill entity pattern for structure
- `updateMetadata()` only allows `altText` and `caption` changes — file data is immutable
- Error codes: `MEDIA_ALREADY_DELETED` for double-delete, domain-level validation

## Files to Touch
- apps/api/src/modules/media/domain/entities/media.entity.ts
- apps/api/src/modules/media/domain/entities/media.entity.spec.ts
- apps/api/src/modules/media/domain/media.types.ts

## Dependencies
- 163 (Prisma schema for type reference)

## Complexity: M

## Progress Log
- [2026-03-20] Started. TDD approach — tests first.
- [2026-03-20] Done — all ACs satisfied. 11 tests passing.
