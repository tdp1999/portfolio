# Task: Setup CQRS Base Infrastructure

## Status: done

## Goal

Configure NestJS CQRS and create base classes for commands/queries.

## Context

CQRS infrastructure needed before creating module handlers.

## Acceptance Criteria

- [x] `@nestjs/cqrs` installed
- [x] CqrsModule imported in AppModule
- [x] `BaseCommand` class with userId and timestamp
- [x] `BaseQuery` class
- [x] Verify CommandBus and QueryBus are injectable

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

- [2026-02-14] Completed all criteria. @nestjs/cqrs v11.0.3 installed, CqrsModule added to AppModule, base classes created, CommandBus/QueryBus injectability verified via integration tests.
