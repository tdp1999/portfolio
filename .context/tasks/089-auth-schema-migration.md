# Task: Auth - Schema Migration & User Entity Updates

## Status: done

## Goal

Add auth-related fields to User Prisma schema and update the domain entity with new methods.

## Context

The Auth module requires new fields on User: `googleId`, `failedLoginAttempts`, `lockedUntil`, `tokenVersion`. The domain entity already has `refreshToken`/`passwordResetToken` fields and methods, but needs new methods for account locking, token versioning, and Google linking.

## Acceptance Criteria

- [x] Prisma schema updated with 4 new fields (`googleId`, `failedLoginAttempts`, `lockedUntil`, `tokenVersion`)
- [x] Migration created and applied
- [x] `password` field made optional (Google-only users have no password)
- [x] User domain entity updated with new methods: `incrementFailedAttempts()`, `lock(until)`, `resetFailedAttempts()`, `incrementTokenVersion()`, `linkGoogle(googleId)`, `isLocked()`
- [x] User mapper updated to handle new fields
- [x] All existing User tests still pass (14 suites, 81 tests)
- [x] New entity method tests written (TDD)

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
- [2026-02-25] Started
- [2026-02-25] Renamed passwordHash → password across all files
- [2026-02-25] Added 4 new fields to schema, types, entity, mapper
- [2026-02-25] Added 6 new entity methods + isLocked()
- [2026-02-25] Migration 20260225120000_auth_fields applied
- [2026-02-25] All 14 suites, 81 tests passing. Type check clean. Done.
