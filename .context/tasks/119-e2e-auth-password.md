# Task: E2E Password Management Tests

## Status: pending

## Goal
E2E tests for forgot password, reset password, and change password flows.

## Context
Covers the full password lifecycle. Reset password requires generating a valid token via the API or DB.

## Acceptance Criteria
- [ ] `auth-password.spec.ts` created
- [ ] Forgot password: submit email → success message shown
- [ ] Forgot password: non-existent email → same success message (no enumeration)
- [ ] Reset password: valid token → password changed, redirect to login
- [ ] Reset password: expired/invalid token → error message
- [ ] Reset password: mismatched passwords → validation error
- [ ] Change password (authenticated): correct current password → success
- [ ] Change password (authenticated): wrong current password → error

## Technical Notes
- For reset password tests, seed a valid reset token directly in DB via Prisma in test setup
- Use `ResetPasswordPage` and `ForgotPasswordPage` page objects
- Change password tests need `authenticatedPage` fixture

## Files to Touch
- `apps/console-e2e/src/auth-password.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: L

## Progress Log
