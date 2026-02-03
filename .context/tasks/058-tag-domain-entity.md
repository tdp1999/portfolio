# Task: Tag Module - Domain Entity

## Status: pending

## Goal
Create Tag domain entity with business logic.

## Context
Simple domain entity. Pattern established here will be reused.

## Acceptance Criteria
- [ ] `Tag` entity class with private constructor
- [ ] `create()` static factory (generates slug from name)
- [ ] `load()` static factory for DB loading
- [ ] `update()` method (regenerates slug if name changes)
- [ ] Props interface defined
- [ ] Unit tests for all methods

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
