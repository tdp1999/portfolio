# Task: Build Forgot Password and Reset Password Pages

## Status: done

## Goal
Implement the forgot password (email submission) and reset password (new password with token) pages.

## Context
Two pages for the password recovery flow. Forgot password sends an email. Reset password consumes the token from the email link and sets a new password.

## Acceptance Criteria
- [ ] **Forgot Password page** (`/auth/forgot-password`):
  - Email input with validation
  - Submit button with loading state
  - Uses `ApiService.post('/auth/forgot-password', { email })`
  - Always shows success message ("If an account exists, we've sent a reset email") — no enumeration
  - Link back to login
- [ ] **Reset Password page** (`/auth/reset-password`):
  - Reads `token` and `userId` from URL query params
  - New password + confirm password inputs with validation (min length, must match)
  - Submit button with loading state
  - Uses `ApiService.post('/auth/reset-password', { token, userId, newPassword })`
  - On success: toast + redirect to login
  - On error (invalid/expired token): error toast, link to try forgot password again
- [ ] Both pages use blank layout
- [ ] Routes added to `app.routes.ts`
- [ ] Responsive, centered card layout

## Technical Notes
- Use `ApiService` from `@portfolio/console/shared/data-access` for API calls (no need to go through AuthStore — these are unauthenticated endpoints)
- Reset password URL sent via email follows pattern: `FRONTEND_URL/auth/reset-password?token=<token>&userId=<userId>`
- These pages don't require authentication (public routes, covered by `guestGuard`)

## Files to Touch
- `apps/console/src/app/pages/auth/forgot-password/forgot-password.ts` (new)
- `apps/console/src/app/pages/auth/reset-password/reset-password.ts` (new)
- `apps/console/src/app/app.routes.ts`

## Dependencies
- 102-console-http-setup
- 106-toast-service

## Complexity: M
