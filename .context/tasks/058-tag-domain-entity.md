# Task: Tag Module - Domain Entity

## Status: done

## Goal

Create Tag domain entity with business logic.

## Context

Simple domain entity. Pattern established here will be reused.

## Acceptance Criteria

- [x] `Tag` entity class with private constructor (extends `BaseCrudEntity`)
- [x] `create()` static factory (generates slug from name)
- [x] `load()` static factory for DB loading
- [x] `update()` method (regenerates slug if name changes)
- [x] `softDelete()` and `restore()` methods
- [x] Props interface defined (`ITagProps extends IBaseAuditProps`)
- [x] Unit tests for all methods (7 tests passing)
- [x] Extracted `BaseCrudEntity` to `@portfolio/shared/types`
- [x] Created `TagErrorCode` enum in `@portfolio/shared/errors`

## Technical Notes

```typescript
export interface ITagProps {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
}

export class Tag {
  private constructor(readonly props: ITagProps) {}

  static create(name: string, userId: string): Tag {
    return new Tag({
      id: IdentifierValue.v7(),
      name,
      slug: SlugValue.from(name),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: userId,
      updatedById: userId,
    });
  }

  static load(props: ITagProps): Tag {
    return new Tag(props);
  }

  update(name: string, userId: string): Tag {
    return new Tag({
      ...this.props,
      name,
      slug: SlugValue.from(name),
      updatedAt: new Date(),
      updatedById: userId,
    });
  }
}
```

## Files to Touch

- apps/api/src/modules/tag/domain/entities/tag.entity.ts
- apps/api/src/modules/tag/domain/entities/tag.entity.spec.ts
- apps/api/src/modules/tag/domain/tag.types.ts

## Dependencies

- 057-tag-prisma-schema
- 045-create-value-objects

## Complexity: S

## Progress Log

- 2026-03-16: Created Tag entity extending BaseCrudEntity. Extracted BaseCrudEntity to shared-types lib. Added TagErrorCode. All tests passing.
