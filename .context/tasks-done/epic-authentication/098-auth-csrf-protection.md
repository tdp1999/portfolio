# Task: Auth - CSRF Protection

## Status: done

## Goal

Implement double-submit cookie CSRF protection for the refresh token endpoint.

## Context

Since the refresh token is stored in an HttpOnly cookie, the refresh endpoint is vulnerable to CSRF attacks. The double-submit cookie pattern mitigates this without server-side session state.

## Acceptance Criteria

- [x] On login/refresh: set a non-HttpOnly CSRF token cookie (`X-CSRF-Token`)
- [x] Refresh endpoint requires `X-CSRF-Token` header matching the cookie value
- [x] CSRF validation implemented as a guard or middleware
- [x] CSRF token rotated on each refresh (alongside refresh token)
- [x] Login response includes initial CSRF token cookie
- [x] Unit tests: valid CSRF, missing header, mismatched token

## Technical Notes

Double-submit cookie pattern:
1. Server sets `csrf_token` cookie (readable by JS, NOT HttpOnly)
2. Client reads cookie value, sends it in `X-CSRF-Token` header
3. Server compares header value vs cookie value
4. Attacker's cross-origin request can send cookies but can't read them → can't set the header

Cookie settings for CSRF token:
```typescript
{
  httpOnly: false, // must be readable by JS
  secure: true,
  sameSite: 'strict',
  path: '/',
}
```

Only the `/api/auth/refresh` endpoint needs this protection (it's the only state-changing endpoint that uses cookie auth). Login uses body credentials, not cookies.

## Files to Touch

- apps/api/src/modules/auth/application/guards/csrf.guard.ts
- apps/api/src/modules/auth/application/guards/csrf.guard.spec.ts
- apps/api/src/modules/auth/application/commands/login.command.ts (add CSRF token generation)
- apps/api/src/modules/auth/application/commands/refresh-token.command.ts (add CSRF validation + rotation)
- apps/api/src/modules/auth/presentation/auth.controller.ts (apply guard)

## Dependencies

- 093-auth-refresh-token-rotation (refresh endpoint must exist)
- 092-auth-login-logout (login sets initial CSRF token)

## Complexity: S

## Progress Log
- [2026-02-25] Started
- [2026-02-25] Completed — all 5 unit tests passing, type check clean
