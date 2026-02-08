# Task: User Module - Domain Entity

## Status: pending

## Goal

Create User domain entity with business logic.

## Context

Domain entity encapsulates User business rules.

## Acceptance Criteria

- [ ] `User` entity class with private constructor
- [ ] `create()` static factory for new users
- [ ] `load()` static factory for loading from DB
- [ ] `updateLastLogin()` method
- [ ] `setRefreshToken()` / `clearRefreshToken()` methods
- [ ] `setPasswordResetToken()` / `clearPasswordResetToken()` methods
- [ ] Unit tests for all methods

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
