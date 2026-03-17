# Task: Category Module - Zod DTOs

## Status: pending

## Goal

Create Zod validation schemas and DTO types for Category module.

## Context

Similar to Tag DTOs but adds description and displayOrder fields.

## Acceptance Criteria

- [ ] `CreateCategorySchema`: name (required, 1-100, trimmed, HTML stripped), description (optional, max 500), displayOrder (optional, int, default 0)
- [ ] `UpdateCategorySchema`: name (optional), description (optional), displayOrder (optional)
- [ ] `CategoryQuerySchema`: page, limit, search (extends Tag query pattern)
- [ ] `CategoryResponseDto` type: id, name, slug, description, displayOrder, createdAt, updatedAt
- [ ] DTO validation unit tests (valid/invalid inputs, transforms, defaults)
- [ ] Zod v4 syntax

## Technical Notes

Follow Tag DTO pattern. Use `z.coerce.number()` for displayOrder from query params.

## Files to Touch

- apps/api/src/modules/category/application/category.dto.ts
- apps/api/src/modules/category/application/category.dto.spec.ts

## Dependencies

- 143-category-prisma-schema

## Complexity: S

Straightforward Zod schemas with minor additions over Tag.

## Progress Log
