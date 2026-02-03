# Task: Tag Module - Queries + Handlers

## Status: pending

## Goal
Create CQRS queries for Tag read operations.

## Context
Read operations: GetById, GetBySlug, List with pagination.

## Acceptance Criteria
- [ ] `GetTagByIdQuery` + handler
- [ ] `GetTagBySlugQuery` + handler
- [ ] `ListTagsQuery` + handler with pagination
- [ ] Unit tests for each handler

## Technical Notes
```typescript
export class ListTagsQuery extends BaseQuery {
  constructor(readonly options: TagQueryDto) {
    super();
  }
}

@QueryHandler(ListTagsQuery)
export class ListTagsHandler implements IQueryHandler<ListTagsQuery> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly repo: ITagRepository,
  ) {}

  async execute(query: ListTagsQuery): Promise<{ data: Tag[]; total: number }> {
    return this.repo.findAll(query.options);
  }
}
```

## Files to Touch
- apps/api/src/modules/tag/application/queries/*.query.ts
- apps/api/src/modules/tag/application/queries/handlers/*.handler.ts
- Test files

## Dependencies
- 059-tag-repository

## Complexity: S

## Progress Log
