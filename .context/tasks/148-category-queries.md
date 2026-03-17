# Task: Category Module - Queries + Handlers

## Status: done

## Goal

Create CQRS queries for Category read operations.

## Context

Three queries: list (paginated), get by ID, get by slug. Follows Tag query pattern.

## Acceptance Criteria

- [x] `ListCategoriesQuery` + handler (validates query params, returns paginated results with metadata)
- [x] `GetCategoryByIdQuery` + handler (validates UUID, returns single category)
- [x] `GetCategoryBySlugQuery` + handler (returns single category)
- [x] All responses mapped to `CategoryResponseDto` (includes description, displayOrder)
- [x] List returns `{ data, total, page, limit }`
- [x] Barrel exports in queries/index.ts

## Technical Notes

Follow Tag queries. List handler should sort by displayOrder then name (handled by repository).

## Files to Touch

- apps/api/src/modules/category/application/queries/list-categories.query.ts
- apps/api/src/modules/category/application/queries/get-category-by-id.query.ts
- apps/api/src/modules/category/application/queries/get-category-by-slug.query.ts
- apps/api/src/modules/category/application/queries/index.ts

## Dependencies

- 145-category-repository
- 146-category-dtos

## Complexity: S

Straightforward read operations, same pattern as Tag.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
