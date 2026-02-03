# Task: User Module - Repository + Mapper

## Status: pending

## Goal
Create User repository port, implementation, and mapper.

## Context
Repository provides data access; mapper converts between Prisma and domain.

## Acceptance Criteria
- [ ] `IUserRepository` port interface
- [ ] `UserRepository` implementation using Prisma
- [ ] `UserMapper.toDomain()` and `toPrisma()` methods
- [ ] Repository methods: `add`, `update`, `findById`, `findByEmail`
- [ ] Unit tests for mapper
- [ ] Integration tests for repository

## Technical Notes
```typescript
// Port
export type IUserRepository = {
  add(user: User): Promise<string>;
  update(id: string, user: User): Promise<boolean>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
};

// DI Token
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
```

## Files to Touch
- apps/api/src/modules/user/application/ports/user.repository.port.ts
- apps/api/src/modules/user/application/user.token.ts
- apps/api/src/modules/user/infrastructure/repositories/user.repository.ts
- apps/api/src/modules/user/infrastructure/mapper/user.mapper.ts
- Test files

## Dependencies
- 050-user-domain-entity

## Complexity: M

## Progress Log
