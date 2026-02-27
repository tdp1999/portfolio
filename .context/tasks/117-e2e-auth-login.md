# Task: E2E Login Page Tests

## Status: pending

## Goal
Comprehensive E2E tests for the login page: happy paths, error cases, and form validation.

## Context
Tests the core login flow against the real API. Uses page objects and fixtures from task 116.

## Acceptance Criteria
- [ ] `auth-login.spec.ts` created
- [ ] Happy: valid credentials → redirected to dashboard, user info visible
- [ ] Happy: valid credentials + Remember Me → refresh cookie has extended expiry
- [ ] Unhappy: wrong password → error toast, stays on login page
- [ ] Unhappy: non-existent email → same generic error (no user enumeration)
- [ ] Unhappy: locked account → generic error, no lock info leaked
- [ ] Validation: empty fields → form validation errors shown
- [ ] Validation: invalid email format → validation error

## Technical Notes
- Use `LoginPage` page object from task 116
- Use real API — no mocking
- Locked user seeded in global setup (task 116)
- Use `page.waitForURL()` for redirect assertions, not arbitrary waits

## Files to Touch
- `apps/console-e2e/src/auth-login.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: M

## Progress Log
