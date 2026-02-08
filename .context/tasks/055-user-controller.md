# Task: User Module - Controller

## Status: pending

## Goal

Create REST controller for User endpoints.

## Context

Controller exposes User operations via HTTP. Note: Full auth will be separate epic.

## Acceptance Criteria

- [ ] `UserController` with route prefix `/api/users`
- [ ] `POST /` - Create user (admin only, for now)
- [ ] `GET /:id` - Get user by ID
- [ ] `PATCH /:id` - Update user
- [ ] Request validation using Zod DTOs
- [ ] Proper HTTP status codes
- [ ] Unit tests for controller

## Technical Notes

```typescript
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const id = await this.commandBus.execute(new CreateUserCommand('system', dto));
    return { id };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetUserByIdQuery(id));
  }
}
```

## Files to Touch

- apps/api/src/modules/user/presentation/user.controller.ts
- apps/api/src/modules/user/presentation/user.controller.spec.ts

## Dependencies

- 053-user-commands
- 054-user-queries

## Complexity: M

## Progress Log
