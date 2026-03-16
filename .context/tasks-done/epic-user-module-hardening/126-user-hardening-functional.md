# Task: User Hardening — Functional Completion (Google SSO Restriction, Invite Flow, Soft-Delete, List Users)

## Status: done

## Goal
Complete all functional requirements: restrict Google SSO to existing users, admin invite flow with email, soft-delete endpoint, and paginated user list.

## Context
Phase 3 of epic-user-module-hardening. Depends on task 124 (entity has inviteToken fields, softDelete() method, CreateUserByAdminSchema exists).

## Acceptance Criteria

### Google SSO Restriction
- [x] `GoogleLoginHandler`: if `findByEmail` returns null, throw `ForbiddenError('This site is invite-only. Contact the administrator.')`
- [x] If user exists but has no `googleId`, still links the googleId (existing behavior preserved)
- [x] If user exists and already has `googleId`, logs in normally (existing behavior preserved)
- [x] Unit test covers the "unknown email" rejection case

### Admin Invite Flow (`POST /users`)
- [x] `InviteUserCommand` created with handler
- [x] Handler validates input with `CreateUserByAdminSchema`
- [x] Checks email uniqueness — throws `ConflictError` if email already exists
- [x] Creates User entity with no password, role `USER`
- [x] Generates a cryptographically random invite token
- [x] Hashes token with SHA-256 before storing on user (`inviteToken`, `inviteTokenExpiresAt` — 72h expiry)
- [x] Saves user via repository
- [x] Sends invite email via email service with the raw (unhashed) token and a set-password link
- [x] Returns new user's public props
- [x] Unit tests cover: success path, duplicate email, email send failure

### Resend Invite (`POST /users/:id/resend-invite`)
- [x] `ResendInviteCommand` created with handler
- [x] Admin-only endpoint (guarded via `RoleGuard('ADMIN')`)
- [x] Finds user by id — throws `NotFoundError` if not found
- [x] Validates user is still pending (has no password set) — throws `ConflictError('User has already activated their account.')` otherwise
- [x] Generates a NEW cryptographically random invite token (invalidates previous link)
- [x] Hashes new token with SHA-256, updates `inviteToken` and resets `inviteTokenExpiresAt` (72h)
- [x] Sends invite email with the new raw token
- [x] Returns success response
- [x] Unit tests cover: success path, user not found, user already activated

### Set-Password Endpoint (`POST /auth/set-password`)
- [x] New command `SetPasswordCommand` with handler
- [x] Accepts `{ token, userId, newPassword }`
- [x] Finds user by `userId`, verifies `inviteToken` hash matches (SHA-256, timing-safe)
- [x] Checks token not expired (`inviteTokenExpiresAt`)
- [x] Validates `newPassword` meets password rules
- [x] Sets hashed password on user, clears `inviteToken` and `inviteTokenExpiresAt`
- [x] Saves updated user
- [x] Route added to `AuthController` (no auth guard — unauthenticated flow)
- [x] Unit tests cover: success, invalid token, expired token, user not found

### Soft-Delete (`DELETE /users/:id`)
- [x] `SoftDeleteUserCommand` created with handler
- [x] Handler finds user, calls `user.softDelete()`, clears refresh token, increments token version
- [x] Saves via repository
- [x] User cannot log in after soft-delete (login handler checks `deletedAt`)
- [x] Admin-only endpoint (guarded in controller via `RoleGuard('ADMIN')`)
- [x] Unit tests cover: success path, user not found, already deleted

### Soft-Delete Query Filtering
- [x] `findById` excludes soft-deleted users (`where: { deletedAt: null }`)
- [x] `findByEmail` excludes soft-deleted users
- [x] `findAll` excludes soft-deleted users
- [x] Login handler rejects soft-deleted users with `UnauthorizedError`
- [x] Refresh token handler rejects soft-deleted users

### List Users with Pagination (`GET /users`)
- [x] `ListUsersQuery` created with handler
- [x] Repository `findAll({ page, limit, search? })` implemented
- [x] Search filters by name OR email (case-insensitive, partial match)
- [x] Returns `{ data: UserPublicDto[], total: number, page: number, limit: number }`
- [x] Handler validates query params with pagination schema (from task 124)
- [x] Admin-only (guarded in controller)
- [x] Unit tests cover: basic list, search, pagination boundaries

## Technical Notes
- Invite token generation: `crypto.randomBytes(32).toString('hex')` → raw token sent in email, hashed version stored
- Set-password route is public (no JwtAccessGuard)
- Soft-delete: increment `tokenVersion` to invalidate existing sessions — check how `tokenVersion` is used in refresh flow
- Pagination: use offset pagination (`skip: (page-1)*limit, take: limit`)
- `ConflictError` — verify it exists in `libs/shared/errors`
- Email service: follow existing email service pattern (check how forgot-password email is sent)
- Resend invite reuses token generation logic from invite flow — extract shared helper if needed
- Revoke invite is covered by soft-delete (no separate endpoint needed)

## Files to Touch
- `apps/api/src/modules/auth/application/commands/google-login.handler.ts`
- `apps/api/src/modules/user/application/commands/invite-user.command.ts` (new)
- `apps/api/src/modules/user/application/commands/invite-user.handler.ts` (new)
- `apps/api/src/modules/auth/application/commands/set-password.command.ts` (new)
- `apps/api/src/modules/auth/application/commands/set-password.handler.ts` (new)
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/user/application/commands/resend-invite.command.ts` (new)
- `apps/api/src/modules/user/application/commands/resend-invite.handler.ts` (new)
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
- 2026-03-15: Implemented all features — Google SSO restriction, invite flow, resend invite, set-password, soft-delete, list users with pagination. Added ConflictError (409). All 242 tests pass (36 suites).
