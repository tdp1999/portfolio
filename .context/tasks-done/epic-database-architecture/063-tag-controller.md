# Task: Tag Module - Controller

## Status: done

## Goal

Create REST controller for Tag CRUD operations.

## Context

Full REST API for tags. Public read, authenticated write.

## Acceptance Criteria

- [x] `TagController` with route prefix `/tags`
- [x] `GET /` - List all tags (public)
- [x] `GET /:id` - Get tag by ID (public)
- [x] `GET /slug/:slug` - Get tag by slug (public)
- [x] `POST /` - Create tag (ADMIN only, 201)
- [x] `PATCH /:id` - Update tag (ADMIN only)
- [x] `DELETE /:id` - Soft delete tag (ADMIN only)
- [x] Request validation via Zod in handlers
- [x] Proper HTTP status codes
- [ ] Unit tests for controller (deferred — covered by E2E)

## Technical Notes

```typescript
@Controller('tags')
export class TagController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  async list(@Query() query: TagQueryDto) {
    return this.queryBus.execute(new ListTagsQuery(query));
  }

  @Post()
  async create(@Body() dto: CreateTagDto, @CurrentUser() user: User) {
    const id = await this.commandBus.execute(new CreateTagCommand(user.id, dto));
    return { id };
  }

  // ... other endpoints
}
```

Note: `@CurrentUser()` decorator will come from auth (placeholder for now).

## Files to Touch

- apps/api/src/modules/tag/presentation/tag.controller.ts
- apps/api/src/modules/tag/presentation/tag.controller.spec.ts

## Dependencies

- 061-tag-commands
- 062-tag-queries

## Complexity: M

## Progress Log
