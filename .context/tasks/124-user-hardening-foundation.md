# Task: User Hardening — Foundation (Schema, Entity, Mapper, DTOs, JWT, RoleGuard, Seed)

## Status: pending

## Goal
Lay the complete foundation for User module hardening: Prisma schema changes, updated entity/mapper, revised DTOs, role in JWT, RoleGuard, and admin seed script.

## Context
Phase 1 of epic-user-module-hardening. All subsequent tasks (security hardening, functional completion, code quality) depend on these changes being in place first.

## Acceptance Criteria

### Prisma Schema
- [ ] `enum Role { ADMIN USER }` added to schema
- [ ] `role Role @default(USER)` column added to User model
- [ ] `deletedAt DateTime?` column added to User model
- [ ] `inviteToken String?` column added to User model
- [ ] `inviteTokenExpiresAt DateTime?` column added to User model
- [ ] Migration generated and applied (`prisma migrate dev`)

### User Entity
- [ ] `role` and `deletedAt` added to `IUserProps` and `ICreateUserPayload`
- [ ] Getters for `role` and `deletedAt` added
- [ ] `toPublicProps()` includes `role` and `hasGoogleLinked` (boolean: `!!googleId`)
- [ ] `softDelete()` method added — returns new User with `deletedAt` set to current timestamp
- [ ] `email` removed from `updateProfile()` — email is now immutable
- [ ] `inviteToken` and `inviteTokenExpiresAt` added to `IUserProps` (optional fields)
- [ ] Entity tests updated/added for new fields and `softDelete()`

### UserMapper
- [ ] Maps `role`, `deletedAt`, `inviteToken`, `inviteTokenExpiresAt` between Prisma model and domain entity

### DTOs
- [ ] `email` removed from `UpdateUserSchema`
- [ ] `CreateUserByAdminSchema` added: `{ name, email, role? }` (role defaults to USER)
- [ ] Pagination/search query schema added: `{ page?, limit?, search? }`

### JWT Payload
- [ ] `role` included in access token claims (`AccessTokenPayload` type updated)
- [ ] `TokenService` updated to include `role` when signing access tokens
- [ ] `JwtStrategy` / `AccessTokenPayload` type reflects new `role` field

### RoleGuard
- [ ] `RoleGuard` created at `apps/api/src/modules/auth/application/guards/role.guard.ts`
- [ ] `@Roles('ADMIN')` decorator created
- [ ] Guard reads `role` from JWT payload (`req.user.role`), checks against required roles
- [ ] Guard registered in AuthModule

### Admin Seed Script
- [ ] `apps/api/prisma/seed.ts` created
- [ ] Reads `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` from env
- [ ] Validates password meets rules before hashing
- [ ] Creates user with `role: ADMIN`, bcrypt-hashed password
- [ ] Idempotent — skips if email already exists
- [ ] `prisma/seed` configured in `package.json`

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
