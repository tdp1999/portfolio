# Task: User Module - Module Wiring + Verify

## Status: pending

## Goal
Wire all User components into NestJS module and verify end-to-end.

## Context
Final task for User module. Ensures all pieces work together.

## Acceptance Criteria
- [ ] `UserModule` created with all providers
- [ ] Repository registered with DI token
- [ ] All command/query handlers registered
- [ ] Controller registered
- [ ] Module imported in AppModule
- [ ] End-to-end test: Create user via API → Query user → Verify
- [ ] All User module tests pass

## Technical Notes
```typescript
@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    // Repository
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    // Command handlers
    CreateUserHandler,
    UpdateUserHandler,
    // Query handlers
    GetUserByIdHandler,
    GetUserByEmailHandler,
  ],
  exports: [USER_REPOSITORY],
})
export class UserModule {}
```

## Files to Touch
- apps/api/src/modules/user/user.module.ts
- apps/api/src/modules/user/index.ts
- apps/api/src/app.module.ts

## Dependencies
- 055-user-controller

## Complexity: S

## Progress Log
