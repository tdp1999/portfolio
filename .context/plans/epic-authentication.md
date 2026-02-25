# Epic: Authentication Module

## Summary

Backend authentication module for the portfolio dashboard. Covers credential-based login/logout, JWT dual-token strategy with refresh rotation, Google SSO, password reset via email, account locking, session revocation, and 30-day "Remember Me" persistence. No authorization/roles — just identity verification.

## Why

The dashboard needs secure access control to protect content management. Authentication is the prerequisite for all dashboard features (content editing, blog management, settings).

## Target Users

- Portfolio owner (single admin user, but designed for multi-user correctness)

## Scope

### In Scope

- Login with email/password (credential-based)
- Logout (single device + logout everywhere)
- JWT access token (15min) + refresh token (30 days / session) with rotation
- "Remember Me" toggle controlling refresh token lifetime
- Google SSO via OAuth2/OpenID Connect (account linking by email)
- Password change (authenticated user)
- Password reset via email (forgot password flow)
- Account locking after 5 failed login attempts (exponential backoff)
- Token version for session revocation ("logout everywhere")
- Email service integration (Resend — also reusable for landing contact form)
- CSRF protection for cookie-based refresh tokens

### Out of Scope

- Frontend/UI (separate epic)
- Authorization / role-based access
- Multi-factor authentication (2FA)
- Magic link login
- Rate limiting at infrastructure level (API gateway)
- Email templates / branding (plain text is fine for MVP)

## High-Level Requirements

### Authentication Core

1. **POST /api/auth/login** — Validate credentials, return access token in response body, set refresh token as HttpOnly cookie. Update `lastLoginAt`. Reset failed attempt counter on success.
2. **POST /api/auth/logout** — Clear refresh token cookie and invalidate refresh token in DB.
3. **POST /api/auth/logout-all** — Increment `tokenVersion` to invalidate all existing tokens across devices.
4. **POST /api/auth/refresh** — Validate refresh token cookie, rotate (issue new refresh + access token, invalidate old refresh token). Reject if token version mismatch.
5. **GET /api/auth/me** — Return current user profile (requires valid access token).

### Google SSO

6. **GET /api/auth/google** — Redirect to Google OAuth2 consent screen.
7. **GET /api/auth/google/callback** — Exchange code for Google profile. Find user by email — if exists, link `googleId` and login. If not, create new user (no password) and login. Issue tokens same as credential login.

### Password Management

8. **POST /api/auth/change-password** — Authenticated. Verify current password, update `passwordHash`.
9. **POST /api/auth/forgot-password** — Accept email, generate time-limited reset token (1 hour), send reset email via Resend. Always return 200 (don't reveal if email exists).
10. **POST /api/auth/reset-password** — Validate reset token + expiry, update `passwordHash`, clear reset token, invalidate all sessions (increment `tokenVersion`).

### Account Locking

11. On failed login: increment `failedLoginAttempts`. After 5 failures, set `lockedUntil` with exponential backoff (1min, 5min, 15min, 30min, 1hr cap).
12. On successful login: reset `failedLoginAttempts` to 0, clear `lockedUntil`.
13. Login attempts while locked return generic "invalid credentials" (don't reveal lock status to attacker).

### Email Service

14. Abstract email service behind `IEmailService` port (application layer). Resend adapter in infrastructure.
15. Reusable for landing contact form (separate module consumes same port).

## Technical Considerations

### Architecture

- New `AuthModule` in `apps/api/src/modules/auth/` following existing CQRS pattern
- AuthModule imports `UserModule` — uses `IUserRepository` for user lookup
- Commands: `LoginCommand`, `LogoutCommand`, `LogoutAllCommand`, `RefreshTokenCommand`, `ChangePasswordCommand`, `ForgotPasswordCommand`, `ResetPasswordCommand`, `GoogleLoginCommand`
- Queries: `GetCurrentUserQuery`
- Guards: `JwtAccessGuard` (protects authenticated endpoints), `GoogleOAuthGuard`
- No validation in controllers — all in command/query handlers per architecture rules

### Token Strategy

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client     │────▶│ Access Token │────▶│  API Endpoints   │
│  (Memory)    │     │  (15 min)    │     │  (JwtAccessGuard)│
└─────────────┘     └──────────────┘     └─────────────────┘
       │
       │  HttpOnly Cookie
       ▼
┌──────────────┐     ┌──────────────────┐
│ Refresh Token│────▶│ POST /auth/refresh│
│ (30d / session)    │ (Rotate + Reissue)│
└──────────────┘     └──────────────────┘
```

- Access token: JWT signed with secret, contains `{ sub: userId, tokenVersion }`
- Refresh token: opaque random string (stored hashed in DB), in HttpOnly/Secure/SameSite=Strict cookie
- "Remember Me" = `maxAge: 30 days` on cookie; without = session cookie

### Dependencies

- `@nestjs/jwt` — JWT signing/verification
- `@nestjs/passport`, `passport-google-oauth20` — Google SSO
- `resend` — Email delivery (free tier: 3,000/month)
- `bcryptjs` — Already in project for password hashing
- `crypto` — Node built-in for refresh token + reset token generation

### Data Model Changes

Add to User (Prisma schema):

```prisma
model User {
  // ... existing fields ...
  googleId              String?   @unique
  failedLoginAttempts   Int       @default(0)
  lockedUntil           DateTime?
  tokenVersion          Int       @default(0)
}
```

Corresponding domain entity updates: `incrementFailedAttempts()`, `lock(until)`, `resetFailedAttempts()`, `incrementTokenVersion()`, `linkGoogle(googleId)`.

### CSRF Protection

- Double-submit cookie pattern: on login/refresh, set a non-HttpOnly CSRF token cookie. Client reads it and sends in `X-CSRF-Token` header. Server compares cookie value vs header.
- Only required for state-changing endpoints that rely on cookie auth (the refresh endpoint).

### Integration Points

- `UserModule` — user lookup, creation (Google SSO), password update
- `IUserRepository` — `findByEmail()`, `update()` (already exists)
- `UpdateLastLoginHandler` — already exists, called after successful auth
- Future: `EmailModule` shared between auth (reset emails) and landing (contact form)

## Risks & Warnings

⚠️ **Token Theft via XSS**
- Access token in JS memory is vulnerable if XSS exists. Mitigated by short lifetime (15min).
- Refresh token in HttpOnly cookie is safe from XSS but needs CSRF protection.
- Ensure CSP headers and sanitize all user input.

⚠️ **Google SSO Account Conflicts**
- A user with email/password tries Google SSO: auto-link `googleId` to existing account.
- A Google-only user (no password) cannot use forgot-password flow — handle gracefully with "account created via Google" message.

⚠️ **Refresh Token Rotation Race Condition**
- If two tabs simultaneously refresh, the first invalidates the token before the second can use it.
- Mitigation: grace period (e.g., 10 seconds) where old refresh token is still valid after rotation.

⚠️ **Email Deliverability**
- Resend free tier is sufficient for a portfolio site but has limits (3,000/month).
- Password reset emails may land in spam — configure SPF/DKIM records for the domain.

⚠️ **Environment Secrets**
- Requires new env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `FRONTEND_URL` (for redirects/reset links).
- Must never be committed to repo.

## Alternatives Considered

### Session-based Auth (server-side sessions)
- **Pros:** Simpler, no token management, instant revocation
- **Cons:** Requires session store (Redis), doesn't scale as well for API consumers, less standard for SPA
- **Why not chosen:** JWT is more appropriate for SPA dashboard + API architecture

### Access Token in HttpOnly Cookie (instead of memory)
- **Pros:** Immune to XSS
- **Cons:** Requires CSRF protection on every API call (not just refresh), more complex, cookies sent on every request
- **Why not chosen:** Memory storage with short-lived access token + HttpOnly refresh cookie is the industry standard balance

### Passport Local Strategy (instead of manual credential check)
- **Pros:** Standardized, middleware-based
- **Cons:** Doesn't align with CQRS pattern — strategy callbacks bypass command handlers
- **Why not chosen:** Manual validation in command handlers keeps architecture consistent

## Success Criteria

- [ ] User can login with email/password and receive access + refresh tokens
- [ ] Access token expires after 15 minutes, silent refresh works
- [ ] "Remember Me" persists session for 30 days
- [ ] Google SSO creates or links account and issues tokens
- [ ] Password reset email is sent and reset flow works end-to-end
- [ ] Account locks after 5 failed attempts with exponential backoff
- [ ] "Logout everywhere" invalidates all sessions
- [ ] Refresh token rotation prevents reuse of old tokens
- [ ] All endpoints follow CQRS pattern with validation in handlers

## Estimated Complexity
XL

**Reasoning:** 8 endpoints, JWT infrastructure, Google OAuth integration, email service, account locking logic, token rotation, CSRF — substantial backend work touching multiple concerns. Likely 10+ tasks.

## Status
broken-down

> Broken down into tasks 089-100 on 2026-02-25

## Created
2026-02-25
