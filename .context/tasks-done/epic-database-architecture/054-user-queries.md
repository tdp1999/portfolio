# Task: User Module - Queries + Handlers

## Status: done

## Goal

Create CQRS queries for User read operations.

## Context

Queries handle read operations through QueryBus.

## Acceptance Criteria

- [ ] `GetUserByIdQuery` + `GetUserByIdHandler`
- [ ] `GetUserByEmailQuery` + `GetUserByEmailHandler`
- [ ] Handlers return domain entities or DTOs
- [ ] Unit tests for each handler

## Technical Notes

```typescript
export class GetUserByIdQuery extends BaseQuery {
  constructor(readonly userId: string) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository
  ) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.repo.findById(query.userId);
  }
}
```

## Files to Touch

- apps/api/src/modules/user/application/queries/\*.query.ts
- apps/api/src/modules/user/application/queries/handlers/\*.handler.ts
- Test files

## Dependencies

- 051-user-repository

## Complexity: S

## Progress Log
