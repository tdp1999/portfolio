# Epic: Category Module

## Summary

Full vertical slice for the Category entity (Blog post categories). Backend CRUD with CQRS, frontend admin UI, and E2E tests. Category is structurally similar to Tag (name, slug, displayOrder) plus a description field and soft delete. First module to validate base classes extracted during Tag sprint.

## Why

- Blog posts need categorization for content organization and navigation
- Validates that `BaseCrudEntity`, `BasePrismaRepository`, and other base classes work for a second module
- Simple scope makes it ideal as the next module after Tag

## Scope

### In Scope

- **BE:** Prisma schema + migration, domain entity, repository (port + impl), mapper, DTOs (Zod v4), CQRS commands (create/update/delete), queries (list/getById/getBySlug), controller, module wiring
- **FE:** Admin dashboard CRUD page (Angular 21, signals, standalone components) — list with search/pagination, create/edit dialog, delete confirmation
- **E2E:** Playwright tests covering full CRUD flow, validation, duplicates, search, soft delete

### Out of Scope

- BlogPost-Category many-to-many relation (will be added in BlogPost epic)
- Public-facing category pages (landing page epic)

## Schema

| Field          | Type               | Constraints           | Notes            |
| -------------- | ------------------ | --------------------- | ---------------- |
| `id`           | `String` (UUID v7) | PK                    |                  |
| `name`         | `String`           | Unique, Not Null      | e.g., "Tutorial" |
| `slug`         | `String`           | Unique, Not Null      | URL-safe         |
| `description`  | `String`           | Nullable              |                  |
| `displayOrder` | `Int`              | Not Null, Default `0` |                  |
| `createdAt`    | `DateTime`         | Not Null              |                  |
| `updatedAt`    | `DateTime`         | Not Null              |                  |
| `createdById`  | `String`           | FK -> User            |                  |
| `updatedById`  | `String`           | FK -> User            |                  |
| `deletedAt`    | `DateTime`         | Nullable              | Soft delete      |
| `deletedById`  | `String`           | FK -> User, Nullable  |                  |

## Differences from Tag

- `description` field (nullable String)
- `displayOrder` field (Int, default 0) — manual sorting for admin
- No soft delete on Tag's original schema design, but both now have it for consistency

## Technical Notes

- **Skills:** Use `prisma-migrate` for schema/migration tasks, `aqa-expert` for E2E tests, `ng-lib` for FE library creation
- Reuse base classes from Tag sprint: `BaseCrudEntity`, `ICrudRepository`, `BaseCommand`, `BaseQuery`
- Follow exact same directory structure as Tag module
- Controller: GET endpoints public, POST/PATCH/DELETE require `JwtAccessGuard` + `RoleGuard(ADMIN)`
- Slug auto-generated from name via `SlugValue.from()`
- Unique constraint on both `name` and `slug`
- Query: support `search`, `page`, `limit`, sort by `displayOrder` then `name`
- Error codes: `CATEGORY_NOT_FOUND`, `CATEGORY_INVALID_INPUT`, `CATEGORY_NAME_TAKEN`, `CATEGORY_ALREADY_DELETED`

## Risks & Mitigations

- **Low risk overall** — near-identical pattern to Tag
- displayOrder reordering: keep simple (just a number field), no automatic reordering logic needed

## Status

done

> Broken down into tasks 143-152 on 2026-03-17. All tasks completed 2026-03-17.

## Created

2026-03-17
