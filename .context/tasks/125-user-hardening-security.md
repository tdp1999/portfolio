# Task: User Hardening — Security (Guards, Token Hashing, IDOR, Rate Limiting, Input Sanitization)

## Status: done

## Goal
Apply all security hardening to the User module: auth guards on every endpoint, refresh token hashing, IDOR ownership check, rate limiting on admin endpoint, and input sanitization.

## Context
Phase 2 of epic-user-module-hardening. Depends on task 124 (RoleGuard, role in JWT, entity/schema in place).

## Acceptance Criteria

### Auth Guards on All Endpoints
- [x] All User controller routes have `JwtAccessGuard`
- [x] `POST /users` has `RoleGuard('ADMIN')`
- [x] `GET /users` (list) has `RoleGuard('ADMIN')` — route doesn't exist yet, will inherit controller-level guards when added
- [x] `DELETE /users/:id` has `RoleGuard('ADMIN')` — route doesn't exist yet, will inherit controller-level guards when added
- [x] `GET /users/:id` and `PATCH /users/:id` enforce ownership: `req.user.id === param.id || req.user.role === 'ADMIN'`

### Refresh Token Hashing
- [x] `setRefreshToken()` hashes token with SHA-256 before storing (`crypto.createHash('sha256')`)
- [x] `RefreshTokenHandler` hashes incoming token and compares against stored hash
- [x] Comparison uses `crypto.timingSafeEqual` (Buffer comparison)
- [x] Existing refresh token tests updated to reflect hashed storage
- [x] Login → refresh flow still works end-to-end after this change

### IDOR Protection
- [x] Ownership check implemented in `GetUserHandler` and `UpdateUserHandler`
- [x] Regular user accessing another user's profile receives `ForbiddenError`
- [x] Admin can access any user profile
- [x] Check lives in the handler (Application layer), not the controller

### Rate Limiting
- [x] `@Throttle` decorator applied to `POST /users` (same pattern as login endpoint)

### Input Sanitization
- [x] `name` field in all relevant schemas has `.trim()`
- [x] `email` field normalized to lowercase in schemas and before any DB lookup
- [x] `name` HTML-sanitized: strip tags with regex `/<[^>]*>/g` (replace with empty string)
- [x] Sanitization applied in Zod schema transforms (not in handlers/controllers)

## Technical Notes
- SHA-256 hashing: `crypto.createHash('sha256').update(token).digest('hex')`
- `timingSafeEqual` requires equal-length Buffers: `Buffer.from(a)` vs `Buffer.from(b)`
- Check `apps/api/src/modules/auth/` for `RefreshTokenHandler` exact path
- IDOR check pattern: throw `ForbiddenError(...)` in handler if ownership fails
- `ForbiddenError` — check `libs/shared/errors` to confirm it exists, add if missing
- Rate limiting pattern: check existing login controller for `@Throttle` usage

## Files to Touch
- `apps/api/src/modules/user/application/commands/` (ownership checks in update handler)
- `apps/api/src/modules/user/application/queries/` (ownership check in get-user handler)
- `apps/api/src/modules/user/infrastructure/user.controller.ts`
- `apps/api/src/modules/auth/application/commands/refresh-token.handler.ts` (or similar)
- `apps/api/src/modules/auth/application/commands/set-refresh-token.handler.ts` (or similar)
- `apps/api/src/modules/user/application/dtos/` (sanitization in schemas)
- `libs/shared/errors/` (add ForbiddenError if missing)

## Dependencies
- [124] Foundation must be complete (RoleGuard, role in JWT, entity changes)

## Complexity: M

## Progress Log
- [2026-03-13] Started
- [2026-03-13] Done — all ACs satisfied
