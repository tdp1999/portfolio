# Task: Tag Module - Controller

## Status: pending

## Goal
Create REST controller for Tag CRUD operations.

## Context
Full REST API for tags. Public read, authenticated write.

## Acceptance Criteria
- [ ] `TagController` with route prefix `/api/tags`
- [ ] `GET /` - List all tags (public)
- [ ] `GET /:id` - Get tag by ID (public)
- [ ] `GET /slug/:slug` - Get tag by slug (public)
- [ ] `POST /` - Create tag (authenticated)
- [ ] `PATCH /:id` - Update tag (authenticated)
- [ ] `DELETE /:id` - Delete tag (authenticated)
- [ ] Request validation using DTOs
- [ ] Proper HTTP status codes (201, 200, 204, 404, 409)
- [ ] Unit tests for controller

## Technical Notes
```typescript
@Controller('tags')
export class TagController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@Query() query: TagQueryDto) {
    return this.queryBus.execute(new ListTagsQuery(query));
  }

  @Post()
  async create(@Body() dto: CreateTagDto, @CurrentUser() user: User) {
    const id = await this.commandBus.execute(
      new CreateTagCommand(user.id, dto)
    );
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
