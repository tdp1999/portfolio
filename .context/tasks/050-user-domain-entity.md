# Task: User Module - Domain Entity

## Status: done

## Goal

Create User domain entity with business logic.

## Context

Domain entity encapsulates User business rules.

## Acceptance Criteria

- [x] `User` entity class with private constructor
- [x] `create()` static factory for new users
- [x] `load()` static factory for loading from DB
- [x] `updateLastLogin()` method
- [x] `setRefreshToken()` / `clearRefreshToken()` methods
- [x] `setPasswordResetToken()` / `clearPasswordResetToken()` methods
- [x] Unit tests for all methods

## Technical Notes

```typescript
export class User {
  private constructor(readonly props: IUserProps) {}

  static create(data: ICreateUserPayload): User {}
  static load(raw: IUserProps): User {}

  updateLastLogin(): User {}
  setRefreshToken(token: string, expiresAt: Date): User {}
  clearRefreshToken(): User {}
}
```

## Files to Touch

- apps/api/src/modules/user/domain/entities/user.entity.ts
- apps/api/src/modules/user/domain/entities/user.entity.spec.ts
- apps/api/src/modules/user/domain/user.types.ts

## Dependencies

- 049-user-prisma-schema
- 045-create-value-objects

## Complexity: M

## Progress Log
- [2026-02-16] Started
- [2026-02-16] All criteria complete, 7 tests passing
