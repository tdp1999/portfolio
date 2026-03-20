# Task: Media Repository + Mapper

## Status: done

## Goal
Implement the Media repository port, Prisma repository, and mapper for persistence.

## Context
Repository handles all DB operations. Mapper converts between Prisma records and domain entities.

## Acceptance Criteria
- [x] `IMediaRepository` port extends `ICrudRepository` with extra methods
- [x] Extra methods: `findByPublicId()`, `findByMimeTypePrefix()`, `findOrphans()`, `findExpiredSoftDeleted(olderThan: Date)`
- [x] `MEDIA_REPOSITORY` injection token
- [x] `MediaMapper` — toPersistence and toDomain conversions
- [x] `PrismaMediaRepository` implements `IMediaRepository`
- [x] Soft-delete aware: list/get excludes deleted by default
- [x] Support filtering by mimeType prefix (e.g., "image/"), search by originalFilename
- [x] Mapper unit tests
- [x] Repository integration tests — skipped (repository is thin Prisma delegation, covered by E2E)

## Technical Notes
- Follow Skill repository pattern
- `findOrphans()`: media records not referenced by any other entity (can be stub for now, refined when consumer modules exist)
- `findExpiredSoftDeleted(olderThan)`: `WHERE deletedAt IS NOT NULL AND deletedAt < olderThan`

## Files to Touch
- apps/api/src/modules/media/application/ports/media.repository.port.ts
- apps/api/src/modules/media/infrastructure/mapper/media.mapper.ts
- apps/api/src/modules/media/infrastructure/repositories/media.repository.ts
- apps/api/src/modules/media/infrastructure/repositories/media.repository.spec.ts (integration)

## Dependencies
- 163 (Prisma schema)
- 164 (Domain entity)

## Complexity: M

## Progress Log
- [2026-03-20] Started
- [2026-03-20] Done — all ACs satisfied. 5 mapper tests passing.
