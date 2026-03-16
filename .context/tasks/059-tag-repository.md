# Task: Tag Module - Repository + Mapper

## Status: done

## Goal

Create Tag repository port, implementation, and mapper.

## Context

Data access layer for Tag. Pattern will be reused across modules.

## Acceptance Criteria

- [x] `ITagRepository` port interface (extends `ICrudRepository<Tag>`)
- [x] `TagRepository` implementation using Prisma
- [x] `TagMapper.toDomain()` and `toPrisma()` methods
- [x] Repository methods: `add`, `update`, `remove`, `findById`, `findBySlug`, `findByName`, `findAll`
- [x] Unit tests for mapper (2 tests)
- [x] `TAG_REPOSITORY` DI token
- [x] Extracted `ICrudRepository`, `PaginatedQuery`, `PaginatedResult` to `@portfolio/shared/types`
- [ ] Integration tests for repository (deferred to E2E task)

## Technical Notes

```typescript
export type ITagRepository = {
  add(tag: Tag): Promise<string>;
  update(id: string, tag: Tag): Promise<boolean>;
  remove(id: string): Promise<boolean>; // Hard delete for Tag
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
};

export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');
```

## Files to Touch

- apps/api/src/modules/tag/application/ports/tag.repository.port.ts
- apps/api/src/modules/tag/application/tag.token.ts
- apps/api/src/modules/tag/infrastructure/repositories/tag.repository.ts
- apps/api/src/modules/tag/infrastructure/mapper/tag.mapper.ts
- Test files

## Dependencies

- 058-tag-domain-entity

## Complexity: M

## Progress Log

- 2026-03-16: Created port, repo, mapper, token. Extracted ICrudRepository + PaginatedQuery/Result to shared-types. All tests passing (262 total).
