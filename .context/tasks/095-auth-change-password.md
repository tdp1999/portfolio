# Task: Auth - Change Password

## Status: pending

## Goal

Implement authenticated password change endpoint.

## Context

Allows logged-in users to change their password. Requires current password verification before updating.

## Acceptance Criteria

- [ ] `POST /api/auth/change-password` — protected by JwtAccessGuard
- [ ] Validates current password before allowing change
- [ ] New password validated against `PasswordSchema` (existing in user.dto.ts)
- [ ] Updates `passwordHash` on User entity
- [ ] Increments `tokenVersion` to invalidate all other sessions after password change
- [ ] Returns 400 if current password wrong
- [ ] Returns 400 if user is Google-only (no password to change)
- [ ] Unit tests (TDD)

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
