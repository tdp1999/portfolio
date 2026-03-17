# Epic: Skill Module

## Summary

Full vertical slice for the Skill entity (technical skills and technologies). Backend CRUD with CQRS, frontend admin UI, and E2E tests. Skill is more complex than Tag/Category due to self-referential `parentSkillId` (1-level hierarchy), `SkillCategory` enum, and additional metadata fields (isLibrary, yearsOfExperience, iconUrl).

## Why

- Skills are referenced by Project and Experience (many-to-many) — needed as a dependency before those modules
- Self-referential hierarchy is a common DDD pattern worth implementing early
- Demonstrates portfolio's technical breadth to recruiters

## Scope

### In Scope

- **BE:** Prisma schema + migration, domain entity with hierarchy validation, repository, mapper, DTOs (Zod v4), CQRS commands/queries, controller, module wiring
- **FE:** Admin dashboard CRUD page — list with category filter/search/pagination, create/edit form (with parent skill selector, category dropdown, isLibrary toggle), delete with children check
- **E2E:** Playwright tests covering CRUD, hierarchy validation, category filtering, duplicate name check

### Out of Scope

- Project-Skill junction table (Project epic)
- Experience-Skill junction table (Experience epic)
- Skill icons upload (use iconUrl string for now, Media integration later)
- Public skill visualization (landing page epic)

## Schema

| Field               | Type                  | Constraints               | Notes                      |
| ------------------- | --------------------- | ------------------------- | -------------------------- |
| `id`                | `String` (UUID v7)    | PK                        |                            |
| `name`              | `String`              | Unique, Not Null          | e.g., "TypeScript"         |
| `slug`              | `String`              | Unique, Not Null          | URL-safe                   |
| `description`       | `String`              | Nullable                  | Brief description          |
| `category`          | `Enum(SkillCategory)` | Not Null                  |                            |
| `isLibrary`         | `Boolean`             | Not Null, Default `false` | Is it a library/framework? |
| `parentSkillId`     | `String`              | FK -> Skill, Nullable     | Max 1 level, no circular   |
| `yearsOfExperience` | `Int`                 | Nullable                  |                            |
| `iconUrl`           | `String`              | Nullable                  | Skill logo URL             |
| `proficiencyNote`   | `String`              | Nullable                  | e.g., "TOEIC 970"         |
| `isFeatured`        | `Boolean`             | Not Null, Default `false` | Landing page highlight     |
| `displayOrder`      | `Int`                 | Not Null, Default `0`     |                            |
| `createdAt`         | `DateTime`            | Not Null                  |                            |
| `updatedAt`         | `DateTime`            | Not Null                  |                            |
| `createdById`       | `String`              | FK -> User                |                            |
| `updatedById`       | `String`              | FK -> User                |                            |
| `deletedAt`         | `DateTime`            | Nullable                  | Soft delete                |
| `deletedById`       | `String`              | FK -> User, Nullable      |                            |

## Key Business Rules

### Parent-Child Hierarchy

- Max 1 level deep: a child cannot be a parent (if skill has `parentSkillId`, it cannot be referenced as another skill's parent)
- No circular references: a skill cannot reference itself
- **Delete guard:** Cannot soft-delete a skill that has children — must delete/reassign children first
- Parent must not be soft-deleted when assigning
- Query support: `findByParentId()`, `findChildren(parentId)`, list with `parentSkill` included

### SkillCategory Enum

Simplified to 3 categories matching landing page tabs: `TECHNICAL`, `TOOLS`, `ADDITIONAL`

- **TECHNICAL:** Programming languages, frameworks, databases, DevOps (Angular, TypeScript, NestJS, PostgreSQL, Docker)
- **TOOLS:** Development and project management tools (Git, Figma, Postman, Jira, Notion)
- **ADDITIONAL:** Soft skills, human languages, methodologies (English, Scrum/Agile, Communication)

Parent skills provide sub-grouping within TECHNICAL (e.g., parent "Frontend" → children Angular, HTML, CSS)

### Additional Queries

- Filter by `category` (enum)
- Filter by `isLibrary` (boolean)
- Filter by `parentSkillId` (show children of a specific skill)
- Include parent skill name in list response
- Sort by `displayOrder` then `name`

## Technical Notes

- **Skills:** Use `prisma-migrate` for schema/migration tasks, `aqa-expert` for E2E tests, `ng-lib` for FE library creation
- Extends `BaseCrudEntity` with additional domain logic for hierarchy validation
- Entity methods: `create()`, `load()`, `update()`, `softDelete()`, `restore()`, `assignParent()`, `removeParent()`
- Repository port extends `ICrudRepository` with: `findBySlug()`, `findByName()`, `findByCategory()`, `findChildren()`, `hasChildren()`
- DTO: `CreateSkillDto` requires `name` + `category`, optional fields for rest
- Error codes: `SKILL_NOT_FOUND`, `SKILL_INVALID_INPUT`, `SKILL_NAME_TAKEN`, `SKILL_ALREADY_DELETED`, `SKILL_HAS_CHILDREN`, `SKILL_CIRCULAR_REFERENCE`, `SKILL_MAX_DEPTH_EXCEEDED`, `SKILL_PARENT_DELETED`

## Risks & Mitigations

- **Self-referential FK in Prisma:** Well-supported, use `@relation("SkillParent")` naming
- **Hierarchy validation complexity:** Limited to 1 level, so simple check (`parent.parentSkillId must be null`)
- **Soft delete + children:** Block delete at handler level, return clear error message

## Status

placeholder

## Created

2026-03-17
