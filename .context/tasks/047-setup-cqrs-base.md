# Task: Setup CQRS Base Infrastructure

## Status: pending

## Goal

Configure NestJS CQRS and create base classes for commands/queries.

## Context

CQRS infrastructure needed before creating module handlers.

## Acceptance Criteria

- [ ] `@nestjs/cqrs` installed
- [ ] CqrsModule imported in AppModule
- [ ] `BaseCommand` class with userId and timestamp
- [ ] `BaseQuery` class
- [ ] Verify CommandBus and QueryBus are injectable

## Technical Notes

```typescript
export abstract class BaseCommand {
  readonly timestamp = new Date();
  constructor(readonly userId: string) {}
}

export abstract class BaseQuery {
  constructor(readonly userId?: string) {}
}
```

## Files to Touch

- package.json
- apps/api/src/app.module.ts
- apps/api/src/shared/cqrs/base.command.ts
- apps/api/src/shared/cqrs/base.query.ts
- apps/api/src/shared/cqrs/index.ts

## Dependencies

- 044-create-prisma-service

## Complexity: S

## Progress Log
