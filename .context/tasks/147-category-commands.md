# Task: Category Module - Commands + Handlers

## Status: pending

## Goal

Create CQRS commands for Category write operations.

## Context

Full CRUD via commands: Create, Update, Delete. Follows Tag command pattern.

## Acceptance Criteria

- [ ] `CreateCategoryCommand` + handler (validates DTO, checks name uniqueness, returns id)
- [ ] `UpdateCategoryCommand` + handler (validates DTO, checks name uniqueness excluding self, partial update)
- [ ] `DeleteCategoryCommand` + handler (soft delete with userId tracking)
- [ ] All handlers validate with Zod schemas via `safeParse()`
- [ ] All handlers use domain entity methods (Category.create, category.update, category.softDelete)
- [ ] Proper error codes from `CategoryErrorCode`
- [ ] Barrel exports in commands/index.ts

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
