# Task: Tag Module - Repository + Mapper

## Status: pending

## Goal

Create Tag repository port, implementation, and mapper.

## Context

Data access layer for Tag. Pattern will be reused across modules.

## Acceptance Criteria

- [ ] `ITagRepository` port interface
- [ ] `TagRepository` implementation using Prisma
- [ ] `TagMapper.toDomain()` and `toPrisma()` methods
- [ ] Repository methods: `add`, `update`, `remove`, `findById`, `findBySlug`, `findAll`
- [ ] Unit tests for mapper
- [ ] Integration tests for repository

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
