# Task: Auth - Error Codes & DTOs

## Status: done

## Goal

Define auth-specific error codes enum and all Zod validation schemas for auth endpoints.

## Context

Following the established pattern from UserErrorCode and user.dto.ts. Auth needs its own error codes and DTOs centralized before handlers are implemented. This task can be done early and in parallel with JWT infrastructure.

## Acceptance Criteria

- [x] `AuthErrorCode` enum defined (INVALID_CREDENTIALS, ACCOUNT_LOCKED, TOKEN_EXPIRED, TOKEN_INVALID, CSRF_MISMATCH, GOOGLE_AUTH_FAILED, PASSWORD_RESET_EXPIRED, GOOGLE_ONLY_ACCOUNT)
- [x] Auth Zod schemas defined: LoginSchema, ChangePasswordSchema, ForgotPasswordSchema, ResetPasswordSchema, GoogleCallbackSchema
- [x] Exported types inferred from schemas
- [x] Unit tests for schema validation edge cases (21 tests)
- [x] LoginSchema moved from user.dto.ts to auth.dto.ts (clean up)

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
- [2026-02-25] Started — most work already done from prior tasks, need to add missing error codes, GoogleCallbackSchema, and tests
- [2026-02-25] Completed — added 5 missing error codes, created GoogleCallbackSchema, moved inline schema from google-login command, 21 DTO tests passing
