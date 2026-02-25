# Task: Auth - Change Password

## Status: done

## Goal

Implement authenticated password change endpoint.

## Context

Allows logged-in users to change their password. Requires current password verification before updating.

## Acceptance Criteria

- [x] `POST /api/auth/change-password` — protected by JwtAccessGuard
- [x] Validates current password before allowing change
- [x] New password validated against `PasswordSchema` (existing in user.dto.ts)
- [x] Updates `passwordHash` on User entity
- [x] Increments `tokenVersion` to invalidate all other sessions after password change
- [x] Returns 400 if current password wrong
- [x] Returns 400 if user is Google-only (no password to change)
- [x] Unit tests (TDD)

## Technical Notes

ChangePasswordSchema:
```typescript
const ChangePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: PasswordSchema,
});
```

Google-only users (no `passwordHash`) should get a clear error: "Account uses Google sign-in. Set a password via forgot-password flow."

## Files to Touch

- apps/api/src/modules/auth/application/commands/change-password.command.ts
- apps/api/src/modules/auth/application/commands/change-password.command.spec.ts
- apps/api/src/modules/auth/application/auth.dto.ts (add schema)
- apps/api/src/modules/auth/presentation/auth.controller.ts (add endpoint)

## Dependencies

- 092-auth-login-logout (JwtAccessGuard, auth controller)

## Complexity: S

## Progress Log

- [2026-02-25] Started
- [2026-02-25] Added User.updatePassword(), ChangePasswordSchema, handler with tests, controller endpoint, module wiring. 138 tests pass.
