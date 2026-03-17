# Task: Category Module - Domain Entity

## Status: done

## Goal

Create Category domain entity with business logic, extending BaseCrudEntity.

## Context

Category entity is similar to Tag but adds `description` and `displayOrder`. Validates that BaseCrudEntity works for a second module without modifications.

## Acceptance Criteria

- [x] `Category` entity class extending `BaseCrudEntity<ICategoryProps>`
- [x] Private constructor, `create()` static factory (generates slug from name)
- [x] `load()` static factory for DB loading
- [x] `update()` method (regenerates slug if name changes, updates description/displayOrder)
- [x] `softDelete()` and `restore()` methods
- [x] `ICategoryProps` interface extending `IBaseAuditProps` with: name, slug, description, displayOrder
- [x] `ICreateCategoryPayload`: name, description?, displayOrder?
- [x] `IUpdateCategoryPayload`: name?, description?, displayOrder?
- [x] Unit tests for all methods
- [x] `CategoryErrorCode` enum in `@portfolio/shared/errors`

## Technical Notes

Error codes: `CATEGORY_NOT_FOUND`, `CATEGORY_INVALID_INPUT`, `CATEGORY_NAME_TAKEN`, `CATEGORY_ALREADY_DELETED`

Follow Tag entity pattern exactly. Key difference: update() must handle partial updates (name, description, displayOrder independently).

## Files to Touch

- apps/api/src/modules/category/domain/entities/category.entity.ts
- apps/api/src/modules/category/domain/entities/category.entity.spec.ts
- apps/api/src/modules/category/domain/category.types.ts
- libs/shared/errors/src/lib/error-codes/category.error-codes.ts

## Dependencies

- 143-category-prisma-schema

## Complexity: S

Near-identical to Tag entity with minor additions.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
