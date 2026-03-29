# Task: Experience repository port + implementation + mapper

## Status: pending

## Goal
Create the repository port interface, Prisma repository implementation with skills eager loading and soft delete filtering, and the bidirectional mapper.

## Context
Experience repository follows the established port/adapter pattern. Key complexity: ExperienceSkill junction management (replace strategy on update), eager loading skills for public queries, and soft delete filtering. Mapper handles Prisma JSON types ↔ domain TranslatableString/TranslatableStringArray conversion.

## Acceptance Criteria

### Repository Port (experience.repository.port.ts)
- [ ] `IExperienceRepository` type extending `ICrudRepository<Experience>`:
  - `add(entity: Experience, skillIds: string[]): Promise<string>` — creates experience + junction rows
  - `update(id: string, entity: Experience, skillIds: string[]): Promise<void>` — updates experience + replaces junction rows (EXP-006)
  - `remove(id: string, entity: Experience): Promise<void>` — soft delete (updates deletedAt/deletedById)
  - `restore(id: string, entity: Experience): Promise<void>` — clears deletedAt/deletedById
  - `findById(id: string): Promise<Experience | null>` — includes skills, excludes soft-deleted
  - `findBySlug(slug: string): Promise<Experience | null>` — includes skills, excludes soft-deleted
  - `findAll(options: ExperienceFindAllOptions): Promise<PaginatedResult<Experience>>` — admin list with pagination, search, includeDeleted
  - `findAllPublic(): Promise<Experience[]>` — public list, non-deleted, sorted by displayOrder ASC then startDate DESC (EXP-003)
  - `slugExists(slug: string): Promise<boolean>` — for collision detection
  - `reorder(items: { id: string; displayOrder: number }[]): Promise<void>` — bulk update displayOrder

### Token (experience.token.ts)
- [ ] `EXPERIENCE_REPOSITORY = Symbol('EXPERIENCE_REPOSITORY')`

### Repository Implementation (experience.repository.ts)
- [ ] Implements `IExperienceRepository`
- [ ] Injects `PrismaService`
- [ ] All read queries filter `deletedAt: null` unless `includeDeleted` option (EXP-004)
- [ ] `add()` uses `prisma.experience.create()` with nested `skills: { create: skillIds.map(...) }`
- [ ] `update()` uses transaction: delete existing ExperienceSkill rows + create new ones + update experience (EXP-006)
- [ ] `findAll()` supports: pagination (page/limit), search (companyName, position JSON), includeDeleted flag
- [ ] `findAllPublic()` returns with `include: { skills: { include: { skill: true } }, companyLogo: true }`, sorted `displayOrder ASC, startDate DESC`
- [ ] `reorder()` uses transaction for bulk `prisma.experience.update()` calls

### Mapper (experience.mapper.ts)
- [ ] `ExperienceMapper.toDomain(prisma: PrismaExperienceWithRelations): Experience` — converts Prisma JSON to TranslatableString/TranslatableStringArray
- [ ] `ExperienceMapper.toPrisma(entity: Experience): PrismaExperienceCreateInput` — converts domain types back to Prisma-compatible JSON
- [ ] Handles nullable fields correctly (description, teamRole, endDate, location fields, client fields)
- [ ] Skill relation mapping: Prisma `ExperienceSkill[]` → `string[]` (skill IDs) on domain side

## Technical Notes
- Follow Skill repository pattern as reference
- Search across `companyName` (plain string) is straightforward. Search across `position` (JsonB) requires Prisma JSON filtering: `position: { path: ['en'], string_contains: search }` — or use raw query for OR across en/vi
- Junction replace strategy (EXP-006): `deleteMany({ experienceId })` then `createMany(skillIds)` in a transaction
- `findAllPublic()` can use a simpler select (no audit fields) for performance, but mapper handles this at domain level

## Files to Touch
- New: `apps/api/src/modules/experience/application/ports/experience.repository.port.ts`
- New: `apps/api/src/modules/experience/application/experience.token.ts`
- New: `apps/api/src/modules/experience/infrastructure/repositories/experience.repository.ts`
- New: `apps/api/src/modules/experience/infrastructure/mapper/experience.mapper.ts`

## Dependencies
- 215 (Prisma schema)
- 216 (Domain entity)

## Complexity: L

## Progress Log
