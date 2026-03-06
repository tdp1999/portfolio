# Task: User Hardening — Foundation (Schema, Entity, Mapper, DTOs, JWT, RoleGuard, Seed)

## Status: done

## Goal
Lay the complete foundation for User module hardening: Prisma schema changes, updated entity/mapper, revised DTOs, role in JWT, RoleGuard, and admin seed script.

## Context
Phase 1 of epic-user-module-hardening. All subsequent tasks (security hardening, functional completion, code quality) depend on these changes being in place first.

## Acceptance Criteria

### Prisma Schema
- [x] `enum Role { ADMIN USER }` added to schema
- [x] `role Role @default(USER)` column added to User model
- [x] `deletedAt DateTime?` column added to User model
- [x] `inviteToken String?` column added to User model
- [x] `inviteTokenExpiresAt DateTime?` column added to User model
- [x] Migration generated and applied (`prisma migrate dev`)

### User Entity
- [x] `role` and `deletedAt` added to `IUserProps` and `ICreateUserPayload`
- [x] Getters for `role` and `deletedAt` added
- [x] `toPublicProps()` includes `role` and `hasGoogleLinked` (boolean: `!!googleId`)
- [x] `softDelete()` method added — returns new User with `deletedAt` set to current timestamp
- [x] `email` removed from `updateProfile()` — email is now immutable
- [x] `inviteToken` and `inviteTokenExpiresAt` added to `IUserProps` (optional fields)
- [x] Entity tests updated/added for new fields and `softDelete()`

### UserMapper
- [x] Maps `role`, `deletedAt`, `inviteToken`, `inviteTokenExpiresAt` between Prisma model and domain entity

### DTOs
- [x] `email` removed from `UpdateUserSchema`
- [x] `CreateUserByAdminSchema` added: `{ name, email, role? }` (role defaults to USER)
- [x] Pagination/search query schema added: `{ page?, limit?, search? }`

### JWT Payload
- [x] `role` included in access token claims (`AccessTokenPayload` type updated)
- [x] `TokenService` updated to include `role` when signing access tokens
- [x] `JwtStrategy` / `AccessTokenPayload` type reflects new `role` field

### RoleGuard
- [x] `RoleGuard` created at `apps/api/src/modules/auth/application/guards/role.guard.ts`
- [x] `@Roles('ADMIN')` decorator created
- [x] Guard reads `role` from JWT payload (`req.user.role`), checks against required roles
- [x] Guard registered in AuthModule

### Admin Seed Script
- [x] `apps/api/prisma/seed.ts` created
- [x] Reads `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` from env
- [x] Validates password meets rules before hashing
- [x] Creates user with `role: ADMIN`, bcrypt-hashed password
- [x] Idempotent — skips if email already exists
- [x] `prisma/seed` configured in `package.json`

## Technical Notes
- Follow existing `passwordResetToken`/`passwordResetExpiresAt` pattern for new `inviteToken` fields
- `hasGoogleLinked` in `toPublicProps()` = `!!this.props.googleId`
- `RoleGuard` lives alongside `JwtAccessGuard` in `modules/auth/application/guards/`
- Seed uses `hashPassword` utility from existing auth utilities
- `AccessTokenPayload` type is in `apps/api/src/modules/auth/` — find exact location before editing

## Files to Touch
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/user/domain/user.entity.ts`
- `apps/api/src/modules/user/domain/user.entity.spec.ts`
- `apps/api/src/modules/user/infrastructure/user.mapper.ts`
- `apps/api/src/modules/user/application/dtos/` (UpdateUserSchema, new schemas)
- `apps/api/src/modules/auth/application/token.service.ts` (or wherever JWT signing lives)
- `apps/api/src/modules/auth/application/guards/role.guard.ts` (new)
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/prisma/seed.ts` (new)
- `apps/api/package.json` (prisma seed config)

## Dependencies
None — this is the foundation task.

## Complexity: L

## Progress Log
