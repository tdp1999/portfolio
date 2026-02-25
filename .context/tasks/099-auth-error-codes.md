# Task: Auth - Error Codes & DTOs

## Status: pending

## Goal

Define auth-specific error codes enum and all Zod validation schemas for auth endpoints.

## Context

Following the established pattern from UserErrorCode and user.dto.ts. Auth needs its own error codes and DTOs centralized before handlers are implemented. This task can be done early and in parallel with JWT infrastructure.

## Acceptance Criteria

- [ ] `AuthErrorCode` enum defined (INVALID_CREDENTIALS, ACCOUNT_LOCKED, TOKEN_EXPIRED, TOKEN_INVALID, CSRF_MISMATCH, GOOGLE_AUTH_FAILED, PASSWORD_RESET_EXPIRED, GOOGLE_ONLY_ACCOUNT)
- [ ] Auth Zod schemas defined: LoginSchema (move from user.dto.ts), RefreshTokenSchema, ChangePasswordSchema, ForgotPasswordSchema, ResetPasswordSchema, GoogleCallbackSchema
- [ ] Exported types inferred from schemas
- [ ] Unit tests for schema validation edge cases
- [ ] LoginSchema moved from user.dto.ts to auth.dto.ts (clean up)

## Technical Notes

Move `LoginSchema` from `apps/api/src/modules/user/application/user.dto.ts` to auth module. Import `PasswordSchema` from user.dto.ts (keep it there since it's a User concern).

## Files to Touch

- apps/api/src/modules/auth/application/auth-error-code.ts
- apps/api/src/modules/auth/application/auth.dto.ts
- apps/api/src/modules/auth/application/auth.dto.spec.ts
- apps/api/src/modules/user/application/user.dto.ts (remove LoginSchema)

## Dependencies

- None (can be done in parallel with other foundation tasks)

## Complexity: S

## Progress Log
