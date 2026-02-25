# Task: Auth - Refresh Token Rotation

## Status: pending

## Goal

Implement refresh token endpoint with token rotation and reuse detection.

## Context

Silent refresh allows the frontend to get new access tokens without re-login. Token rotation (issuing a new refresh token on each refresh) limits the damage of stolen tokens.

## Acceptance Criteria

- [ ] `POST /api/auth/refresh` — reads refresh token from HttpOnly cookie, validates against DB hash
- [ ] Issues new access token + new refresh token (rotation)
- [ ] Old refresh token invalidated in DB immediately
- [ ] Rejects if token version in JWT doesn't match DB `tokenVersion`
- [ ] Grace period: old refresh token valid for 10 seconds after rotation (race condition mitigation)
- [ ] Returns `{ accessToken }` in body, sets new refresh token cookie
- [ ] Returns 401 if refresh token missing, invalid, or expired
- [ ] Unit tests covering: valid refresh, expired token, reused token, version mismatch, grace period

## Technical Notes

Refresh flow:
1. Extract refresh token from cookie
2. Find user by ID from the (still valid) context or decode a minimal claim
3. Compare refresh token against stored hash
4. Check `tokenVersion` matches
5. Generate new refresh token, hash it, store in DB
6. Sign new access token
7. Set new cookie, return access token

Grace period approach: store `previousRefreshToken` and `previousRefreshTokenExpiresAt` (10s after rotation). Accept either current or previous token. This may require 2 additional fields on User, or handle with a simple in-memory cache. Discuss trade-offs in implementation.

Alternative simpler approach: skip grace period for MVP, add it if race conditions are observed in practice.

## Files to Touch

- apps/api/src/modules/auth/application/commands/refresh-token.command.ts
- apps/api/src/modules/auth/application/commands/refresh-token.command.spec.ts
- apps/api/src/modules/auth/presentation/auth.controller.ts (add endpoint)

## Dependencies

- 092-auth-login-logout (login must set the initial refresh token)

## Complexity: M

## Progress Log
