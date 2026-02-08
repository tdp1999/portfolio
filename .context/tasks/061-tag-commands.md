# Task: Tag Module - Commands + Handlers

## Status: pending

## Goal

Create CQRS commands for Tag write operations.

## Context

Full CRUD via commands: Create, Update, Delete.

## Acceptance Criteria

- [ ] `CreateTagCommand` + `CreateTagHandler`
- [ ] `UpdateTagCommand` + `UpdateTagHandler`
- [ ] `DeleteTagCommand` + `DeleteTagHandler`
- [ ] Handlers validate uniqueness (name/slug)
- [ ] Handlers return appropriate results
- [ ] Unit tests for each handler

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
