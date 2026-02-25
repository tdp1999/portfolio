# Task: Auth - Login & Logout Endpoints

## Status: pending

## Goal

Implement credential-based login and logout with JWT access token + refresh token cookie.

## Context

Core auth flow. Login validates credentials, issues tokens. Logout clears tokens. This is the first endpoint that uses the JWT infrastructure from task 090.

## Acceptance Criteria

- [ ] `POST /api/auth/login` — validates email/password, returns `{ accessToken }` in body, sets refresh token as HttpOnly cookie
- [ ] "Remember Me" flag controls refresh token cookie lifetime (30 days vs session cookie)
- [ ] `lastLoginAt` updated on successful login (uses existing `UpdateLastLoginCommand`)
- [ ] `POST /api/auth/logout` — clears refresh token cookie, nullifies refresh token in DB
- [ ] `POST /api/auth/logout-all` — increments `tokenVersion`, clears refresh token
- [ ] `GET /api/auth/me` — returns current user profile (protected by JwtAccessGuard)
- [ ] Login returns generic "Invalid credentials" for both wrong email and wrong password
- [ ] LoginSchema validation in handler (email + password + rememberMe boolean)
- [ ] All handlers follow CQRS pattern with Zod validation
- [ ] Unit tests for all handlers (TDD)
- [ ] Auth controller is thin — no logic, no error throwing

## Technical Notes

Login flow:
1. Validate input (LoginSchema — already exists in user.dto.ts, move or import)
2. Find user by email
3. Check if account is locked (`isLocked()`) — return generic error if locked
4. Compare password with `comparePassword()`
5. On failure: dispatch to account locking logic (task 094)
6. On success: reset failed attempts, generate tokens, set cookie, update lastLoginAt

Refresh token cookie settings:
```typescript
{
  httpOnly: true,
  secure: true, // false in dev
  sameSite: 'strict',
  path: '/api/auth/refresh', // only sent to refresh endpoint
  maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined // 30 days or session
}
```

Commands: `LoginCommand`, `LogoutCommand`, `LogoutAllCommand`
Queries: `GetCurrentUserQuery`

## Files to Touch

- apps/api/src/modules/auth/presentation/auth.controller.ts
- apps/api/src/modules/auth/application/auth.dto.ts
- apps/api/src/modules/auth/application/auth-error-code.ts
- apps/api/src/modules/auth/application/commands/login.command.ts
- apps/api/src/modules/auth/application/commands/logout.command.ts
- apps/api/src/modules/auth/application/commands/logout-all.command.ts
- apps/api/src/modules/auth/application/queries/get-current-user.query.ts
- + spec files for each handler

## Dependencies

- 090-auth-jwt-infrastructure (TokenService, JwtAccessGuard)
- 089-auth-schema-migration (User entity methods)

## Complexity: L

## Progress Log
