# Task: User Module - Commands + Handlers

## Status: done

## Goal

Create CQRS commands for User write operations.

## Context

Commands handle create/update operations through CommandBus.

## Acceptance Criteria

- [ ] `CreateUserCommand` + `CreateUserHandler`
- [ ] `UpdateUserCommand` + `UpdateUserHandler`
- [ ] `UpdateLastLoginCommand` + handler
- [ ] Handlers use repository via DI
- [ ] Unit tests for each handler

## Technical Notes

```typescript
export class CreateUserCommand extends BaseCommand {
  constructor(
    userId: string, // Who is creating (or system)
    readonly data: CreateUserDto
  ) {
    super(userId);
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repo: IUserRepository
  ) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const user = User.create(command.data);
    return this.repo.add(user);
  }
}
```

## Files to Touch

- apps/api/src/modules/user/application/commands/\*.command.ts
- apps/api/src/modules/user/application/commands/handlers/\*.handler.ts
- Test files

## Dependencies

- 051-user-repository
- 052-user-dtos
- 047-setup-cqrs-base

## Complexity: M

## Progress Log
