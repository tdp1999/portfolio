# Task: Auth - Google SSO (OAuth2/OpenID Connect)

## Status: pending

## Goal

Implement Google Sign-In via OAuth2 with account linking by email.

## Context

Allows users to authenticate with their Google account. If a user with that email already exists, link the Google account. If not, create a new user without a password.

## Acceptance Criteria

- [ ] `@nestjs/passport` and `passport-google-oauth20` installed
- [ ] `GET /api/auth/google` — redirects to Google consent screen
- [ ] `GET /api/auth/google/callback` — handles OAuth callback
- [ ] If user with email exists: link `googleId`, issue tokens, login
- [ ] If user doesn't exist: create new user (no password, with googleId), issue tokens
- [ ] Issues same access + refresh tokens as credential login
- [ ] `GoogleOAuthGuard` implemented using Passport
- [ ] Google strategy configured with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, callback URL
- [ ] Callback redirects to frontend with access token (e.g., `{FRONTEND_URL}/auth/callback?token={accessToken}`)
- [ ] Refresh token set as HttpOnly cookie (same as credential login)
- [ ] Unit tests for GoogleLoginCommand handler (TDD)

## Technical Notes

Google strategy extracts: `email`, `displayName`, `googleId` from profile.

The GoogleOAuthGuard is an exception to the "no Passport" approach — Google OAuth requires the redirect flow that Passport handles well. The actual business logic (find/create user, issue tokens) stays in the CQRS command handler.

Flow:
1. User hits `GET /api/auth/google` → GoogleOAuthGuard redirects to Google
2. Google redirects to `GET /api/auth/google/callback` with code
3. Passport exchanges code for profile
4. Controller dispatches `GoogleLoginCommand` with profile data
5. Handler finds/creates user, issues tokens
6. Controller sets refresh cookie, redirects to frontend with access token

Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.

## Files to Touch

- apps/api/src/modules/auth/application/commands/google-login.command.ts
- apps/api/src/modules/auth/application/commands/google-login.command.spec.ts
- apps/api/src/modules/auth/application/guards/google-oauth.guard.ts
- apps/api/src/modules/auth/infrastructure/strategies/google.strategy.ts
- apps/api/src/modules/auth/presentation/auth.controller.ts (add endpoints)

## Dependencies

- 092-auth-login-logout (auth module, token infrastructure, cookie handling)
- 089-auth-schema-migration (googleId field on User)

## Complexity: L

## Progress Log
