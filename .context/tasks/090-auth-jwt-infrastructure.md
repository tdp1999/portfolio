# Task: Auth - JWT Infrastructure & Module Scaffold

## Status: pending

## Goal

Set up JWT signing/verification infrastructure, auth module scaffold, and the JwtAccessGuard.

## Context

Foundation for all auth endpoints. Installs `@nestjs/jwt`, creates the AuthModule structure following CQRS pattern, and implements the JWT access guard that protects authenticated endpoints.

## Acceptance Criteria

- [ ] `@nestjs/jwt` installed
- [ ] AuthModule created at `apps/api/src/modules/auth/` with CQRS structure
- [ ] `TokenService` created — handles access token signing/verification and refresh token generation/hashing
- [ ] `JwtAccessGuard` implemented — extracts Bearer token from Authorization header, verifies JWT, checks `tokenVersion` against DB
- [ ] Auth config (JWT secrets, expiry times) loaded from environment variables
- [ ] AuthModule registered in AppModule
- [ ] Unit tests for TokenService (sign, verify, refresh token generation)
- [ ] Unit tests for JwtAccessGuard (valid token, expired, invalid, version mismatch)

## Technical Notes

TokenService responsibilities:
- `signAccessToken(userId, tokenVersion)` → JWT string (15min expiry)
- `verifyAccessToken(token)` → payload or throw
- `generateRefreshToken()` → random opaque string (crypto.randomBytes)
- `hashRefreshToken(token)` → bcrypt hash for DB storage
- `compareRefreshToken(token, hash)` → boolean

JwtAccessGuard:
- Implements NestJS `CanActivate`
- Extracts token from `Authorization: Bearer <token>`
- Verifies signature and expiry via TokenService
- Loads user from DB, checks `tokenVersion` matches token claim
- Sets `request.user` with user data

Auth config env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY` (default 15m), `JWT_REFRESH_EXPIRY` (default 30d).

## Files to Touch

- apps/api/src/modules/auth/auth.module.ts
- apps/api/src/modules/auth/application/services/token.service.ts
- apps/api/src/modules/auth/application/services/token.service.spec.ts
- apps/api/src/modules/auth/application/guards/jwt-access.guard.ts
- apps/api/src/modules/auth/application/guards/jwt-access.guard.spec.ts
- apps/api/src/modules/auth/application/auth.config.ts
- apps/api/src/app/app.module.ts

## Dependencies

- 089-auth-schema-migration (tokenVersion field must exist)

## Complexity: L

## Progress Log
