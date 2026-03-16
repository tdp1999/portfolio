# Task: Tag Module - Commands + Handlers

## Status: done

## Goal

Create CQRS commands for Tag write operations.

## Context

Full CRUD via commands: Create, Update, Delete.

## Acceptance Criteria

- [x] `CreateTagCommand` + `CreateTagHandler` (validates, checks name uniqueness, returns id)
- [x] `UpdateTagCommand` + `UpdateTagHandler` (validates, checks name uniqueness excluding self)
- [x] `DeleteTagCommand` + `DeleteTagHandler` (soft delete with userId tracking)
- [x] Handlers validate uniqueness (name)
- [x] Handlers return appropriate results
- [ ] Unit tests for each handler (deferred — covered by E2E)

## Technical Notes

```typescript
export class CreateTagCommand extends BaseCommand {
  constructor(
    userId: string,
    readonly data: CreateTagDto
  ) {
    super(userId);
  }
}

@CommandHandler(CreateTagCommand)
export class CreateTagHandler implements ICommandHandler<CreateTagCommand> {
  constructor(
    @Inject(TAG_REPOSITORY)
    private readonly repo: ITagRepository
  ) {}

  async execute(command: CreateTagCommand): Promise<string> {
    // Check uniqueness
    const existing = await this.repo.findBySlug(SlugValue.from(command.data.name));
    if (existing) {
      throw new ConflictException('Tag already exists');
    }

    const tag = Tag.create(command.data.name, command.userId);
    return this.repo.add(tag);
  }
}
```

## Files to Touch

- apps/api/src/modules/tag/application/commands/\*.command.ts
- apps/api/src/modules/tag/application/commands/handlers/\*.handler.ts
- Test files

## Dependencies

- 059-tag-repository
- 060-tag-dtos

## Complexity: M

## Progress Log
