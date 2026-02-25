# Task: Auth - Schema Migration & User Entity Updates

## Status: pending

## Goal

Add auth-related fields to User Prisma schema and update the domain entity with new methods.

## Context

The Auth module requires new fields on User: `googleId`, `failedLoginAttempts`, `lockedUntil`, `tokenVersion`. The domain entity already has `refreshToken`/`passwordResetToken` fields and methods, but needs new methods for account locking, token versioning, and Google linking.

## Acceptance Criteria

- [ ] Prisma schema updated with 4 new fields (`googleId`, `failedLoginAttempts`, `lockedUntil`, `tokenVersion`)
- [ ] Migration created and applied
- [ ] `passwordHash` field made optional (Google-only users have no password)
- [ ] User domain entity updated with new methods: `incrementFailedAttempts()`, `lock(until)`, `resetFailedAttempts()`, `incrementTokenVersion()`, `linkGoogle(googleId)`
- [ ] User mapper updated to handle new fields
- [ ] All existing User tests still pass
- [ ] New entity method tests written (TDD)

## Technical Notes

Prisma additions:
```prisma
model User {
  // ... existing fields ...
  passwordHash          String?              // Change from String to String? for Google-only users
  googleId              String?   @unique
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  tokenVersion          Int       @default(0)
}
```

Domain entity new methods (immutable, return new User):
- `incrementFailedAttempts()` — bumps counter by 1
- `lock(until: Date)` — sets `lockedUntil`
- `resetFailedAttempts()` — resets counter to 0, clears `lockedUntil`
- `incrementTokenVersion()` — bumps `tokenVersion` by 1
- `linkGoogle(googleId: string)` — sets `googleId`
- `isLocked()` — checks if `lockedUntil` is in the future

Update `IUserProps` and `ICreateUserPayload` interfaces accordingly.

## Files to Touch

- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/
- apps/api/src/modules/user/domain/user.types.ts
- apps/api/src/modules/user/domain/entities/user.entity.ts
- apps/api/src/modules/user/domain/entities/user.entity.spec.ts
- apps/api/src/modules/user/infrastructure/mapper/user.mapper.ts

## Dependencies

- 056-user-module-wiring (User module must be complete)

## Complexity: M

## Progress Log
