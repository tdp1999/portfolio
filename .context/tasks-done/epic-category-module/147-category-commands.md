# Task: Category Module - Commands + Handlers

## Status: done

## Goal

Create CQRS commands for Category write operations.

## Context

Full CRUD via commands: Create, Update, Delete. Follows Tag command pattern.

## Acceptance Criteria

- [x] `CreateCategoryCommand` + handler (validates DTO, checks name uniqueness, returns id)
- [x] `UpdateCategoryCommand` + handler (validates DTO, checks name uniqueness excluding self, partial update)
- [x] `DeleteCategoryCommand` + handler (soft delete with userId tracking)
- [x] All handlers validate with Zod schemas via `safeParse()`
- [x] All handlers use domain entity methods (Category.create, category.update, category.softDelete)
- [x] Proper error codes from `CategoryErrorCode`
- [x] Barrel exports in commands/index.ts

## Technical Notes

Follow Tag commands pattern. Update handler must handle partial updates — only regenerate slug if name changes.

Delete handler: check `deletedAt` already set → throw `CATEGORY_ALREADY_DELETED`.

## Files to Touch

- apps/api/src/modules/category/application/commands/create-category.command.ts
- apps/api/src/modules/category/application/commands/update-category.command.ts
- apps/api/src/modules/category/application/commands/delete-category.command.ts
- apps/api/src/modules/category/application/commands/index.ts

## Dependencies

- 145-category-repository
- 146-category-dtos

## Complexity: M

3 command handlers with validation and business logic.

## Progress Log
- [2026-03-17] Done — all ACs satisfied
