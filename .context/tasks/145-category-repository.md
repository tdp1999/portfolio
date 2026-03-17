# Task: Category Module - Repository + Mapper

## Status: done

## Goal

Create Category repository port, Prisma implementation, and mapper.

## Context

Follows Tag repository pattern. Adds `findAll` sorting by `displayOrder` then `name`.

## Acceptance Criteria

- [x] `ICategoryRepository` port interface extending `ICrudRepository<Category>`
- [x] Additional port methods: `update()`, `remove()`, `findBySlug()`, `findByName()`
- [x] `findAll()` with `CategoryFindAllOptions` (page, limit, search, includeDeleted)
- [x] `findAll()` sorts by `displayOrder ASC` then `name ASC`
- [x] `CategoryRepository` Prisma implementation
- [x] Soft delete filtering (deletedAt: null) by default
- [x] `CategoryMapper` with `toDomain()` and `toPrisma()` static methods
- [x] Mapper unit tests
- [x] DI token: `CATEGORY_REPOSITORY`

## Technical Notes

Follow Tag repository pattern. Key difference: `findAll` order by `[{ displayOrder: 'asc' }, { name: 'asc' }]`.

Search should match against `name` and `description` fields (Tag only searches `name`).

## Files to Touch

- apps/api/src/modules/category/application/ports/category.repository.port.ts
- apps/api/src/modules/category/application/category.token.ts
- apps/api/src/modules/category/infrastructure/repositories/category.repository.ts
- apps/api/src/modules/category/infrastructure/mapper/category.mapper.ts
- apps/api/src/modules/category/infrastructure/mapper/category.mapper.spec.ts

## Dependencies

- 144-category-domain-entity

## Complexity: M

Repository + mapper + tests, multiple files.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
