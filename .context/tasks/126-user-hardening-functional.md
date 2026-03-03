# Task: User Hardening — Functional Completion (Google SSO Restriction, Invite Flow, Soft-Delete, List Users)

## Status: pending

## Goal
Complete all functional requirements: restrict Google SSO to existing users, admin invite flow with email, soft-delete endpoint, and paginated user list.

## Context
Phase 3 of epic-user-module-hardening. Depends on task 124 (entity has inviteToken fields, softDelete() method, CreateUserByAdminSchema exists).

## Acceptance Criteria

### Google SSO Restriction
- [ ] `GoogleLoginHandler`: if `findByEmail` returns null, throw `ForbiddenError('This site is invite-only. Contact the administrator.')`
- [ ] If user exists but has no `googleId`, still links the googleId (existing behavior preserved)
- [ ] If user exists and already has `googleId`, logs in normally (existing behavior preserved)
- [ ] Unit test covers the "unknown email" rejection case

### Admin Invite Flow (`POST /users`)
- [ ] `InviteUserCommand` created with handler
- [ ] Handler validates input with `CreateUserByAdminSchema`
- [ ] Checks email uniqueness — throws `ConflictError` if email already exists
- [ ] Creates User entity with no password, role `USER`
- [ ] Generates a cryptographically random invite token
- [ ] Hashes token with SHA-256 before storing on user (`inviteToken`, `inviteTokenExpiresAt` — 72h expiry)
- [ ] Saves user via repository
- [ ] Sends invite email via email service with the raw (unhashed) token and a set-password link
- [ ] Returns new user's public props
- [ ] Unit tests cover: success path, duplicate email, email send failure

### Set-Password Endpoint (`POST /auth/set-password`)
- [ ] New command `SetPasswordCommand` with handler
- [ ] Accepts `{ token, userId, newPassword }`
- [ ] Finds user by `userId`, verifies `inviteToken` hash matches (SHA-256, timing-safe)
- [ ] Checks token not expired (`inviteTokenExpiresAt`)
- [ ] Validates `newPassword` meets password rules
- [ ] Sets hashed password on user, clears `inviteToken` and `inviteTokenExpiresAt`
- [ ] Saves updated user
- [ ] Route added to `AuthController` (no auth guard — unauthenticated flow)
- [ ] Unit tests cover: success, invalid token, expired token, user not found

### Soft-Delete (`DELETE /users/:id`)
- [ ] `SoftDeleteUserCommand` created with handler
- [ ] Handler finds user, calls `user.softDelete()`, clears refresh token, increments token version
- [ ] Saves via repository
- [ ] User cannot log in after soft-delete (login handler checks `deletedAt`)
- [ ] Admin-only endpoint (guarded in controller via `RoleGuard('ADMIN')`)
- [ ] Unit tests cover: success path, user not found, already deleted

### Soft-Delete Query Filtering
- [ ] `findById` excludes soft-deleted users (`where: { deletedAt: null }`)
- [ ] `findByEmail` excludes soft-deleted users
- [ ] `findAll` excludes soft-deleted users
- [ ] Login handler rejects soft-deleted users with `UnauthorizedError`
- [ ] Refresh token handler rejects soft-deleted users

### List Users with Pagination (`GET /users`)
- [ ] `ListUsersQuery` created with handler
- [ ] Repository `findAll({ page, limit, search? })` implemented
- [ ] Search filters by name OR email (case-insensitive, partial match)
- [ ] Returns `{ data: UserPublicDto[], total: number, page: number, limit: number }`
- [ ] Handler validates query params with pagination schema (from task 124)
- [ ] Admin-only (guarded in controller)
- [ ] Unit tests cover: basic list, search, pagination boundaries

## Technical Notes
- Invite token generation: `crypto.randomBytes(32).toString('hex')` → raw token sent in email, hashed version stored
- Set-password route is public (no JwtAccessGuard)
- Soft-delete: increment `tokenVersion` to invalidate existing sessions — check how `tokenVersion` is used in refresh flow
- Pagination: use offset pagination (`skip: (page-1)*limit, take: limit`)
- `ConflictError` — verify it exists in `libs/shared/errors`
- Email service: follow existing email service pattern (check how forgot-password email is sent)

## Files to Touch
- `apps/api/src/modules/auth/application/commands/google-login.handler.ts`
- `apps/api/src/modules/user/application/commands/invite-user.command.ts` (new)
- `apps/api/src/modules/user/application/commands/invite-user.handler.ts` (new)
- `apps/api/src/modules/auth/application/commands/set-password.command.ts` (new)
- `apps/api/src/modules/auth/application/commands/set-password.handler.ts` (new)
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/user/application/commands/soft-delete-user.command.ts` (new)
- `apps/api/src/modules/user/application/commands/soft-delete-user.handler.ts` (new)
- `apps/api/src/modules/user/application/queries/list-users.query.ts` (new)
- `apps/api/src/modules/user/application/queries/list-users.handler.ts` (new)
- `apps/api/src/modules/user/infrastructure/user.repository.ts`
- `apps/api/src/modules/user/user.module.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- Login and refresh handlers (soft-delete filtering)

## Dependencies
- [124] Foundation (entity with inviteToken, softDelete(), schemas)
- [125] Security (IDOR checks pattern established, ForbiddenError confirmed)

## Complexity: L

## Progress Log
