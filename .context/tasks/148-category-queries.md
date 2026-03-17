# Task: Category Module - Queries + Handlers

## Status: pending

## Goal

Create CQRS queries for Category read operations.

## Context

Three queries: list (paginated), get by ID, get by slug. Follows Tag query pattern.

## Acceptance Criteria

- [ ] `ListCategoriesQuery` + handler (validates query params, returns paginated results with metadata)
- [ ] `GetCategoryByIdQuery` + handler (validates UUID, returns single category)
- [ ] `GetCategoryBySlugQuery` + handler (returns single category)
- [ ] All responses mapped to `CategoryResponseDto` (includes description, displayOrder)
- [ ] List returns `{ data, total, page, limit }`
- [ ] Barrel exports in queries/index.ts

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
