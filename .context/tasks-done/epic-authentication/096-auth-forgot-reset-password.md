# Task: Auth - Forgot & Reset Password

## Status: done

## Goal

Implement forgot-password (email reset link) and reset-password (consume token) endpoints.

## Context

Allows users who forgot their password to reset it via email. Uses Resend email service and the existing `passwordResetToken`/`passwordResetExpiresAt` fields on User.

## Acceptance Criteria

- [x] `POST /api/auth/forgot-password` — accepts email, generates reset token, sends email
- [x] Always returns 200 regardless of whether email exists (security)
- [x] Reset token is a random string, stored hashed in DB, expires in 1 hour
- [x] `POST /api/auth/reset-password` — accepts token + new password, validates token, updates password
- [x] Clears reset token after successful reset
- [x] Increments `tokenVersion` to invalidate all sessions
- [x] Rejects Google-only users with "Account uses Google sign-in" message (in forgot-password)
- [x] Actually, forgot-password should still return 200 for Google-only users (don't leak info) — just don't send email
- [x] Email contains reset link: `{FRONTEND_URL}/auth/reset-password?token={token}`
- [x] Unit tests for both handlers (TDD)

## Technical Notes

Forgot-password flow:
1. Validate email format
2. Find user by email (silently return if not found)
3. Skip if Google-only user (no passwordHash and no password ever set)
4. Generate token via `crypto.randomBytes(32).toString('hex')`
5. Hash token, store hash + expiry (1 hour) on User via `setPasswordResetToken()`
6. Send email via `IEmailService`

Reset-password flow:
1. Validate token + new password
2. Find user by iterating or add a lookup method — but reset tokens are hashed, so we need the user ID in the reset link too: `?token={token}&id={userId}`
3. Compare token against stored hash
4. Check expiry
5. Update passwordHash, clear reset token, increment tokenVersion

Email content (plain text MVP):
```
Subject: Password Reset
Body: Click to reset your password: {link}. This link expires in 1 hour.
```

## Files to Touch

- apps/api/src/modules/auth/application/commands/forgot-password.command.ts
- apps/api/src/modules/auth/application/commands/forgot-password.command.spec.ts
- apps/api/src/modules/auth/application/commands/reset-password.command.ts
- apps/api/src/modules/auth/application/commands/reset-password.command.spec.ts
- apps/api/src/modules/auth/application/auth.dto.ts (add schemas)
- apps/api/src/modules/auth/presentation/auth.controller.ts (add endpoints)

## Dependencies

- 091-auth-email-service (IEmailService must exist)
- 092-auth-login-logout (auth controller, auth module structure)

## Complexity: L

## Progress Log

- [2026-02-25] Started
- [2026-02-25] All criteria completed — tests pass, type check clean
