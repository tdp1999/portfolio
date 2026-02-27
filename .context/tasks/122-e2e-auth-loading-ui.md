# Task: E2E Loading Indicators & Toast Tests

## Status: pending

## Goal
E2E tests verifying loading spinners and toast notifications during auth flows.

## Context
Ensures the UX polish elements work: full-page spinner during bootstrap, toasts on login success/failure.

## Acceptance Criteria
- [ ] `auth-loading.spec.ts` created
- [ ] Full-page spinner visible during auth bootstrap (intercept refresh endpoint to delay response)
- [ ] Toast appears on login failure and auto-dismisses
- [ ] Toast appears on login success (if applicable)

## Technical Notes
- Use `page.route()` to intercept `/api/auth/refresh` and add delay to test spinner visibility
- Use `page.waitForSelector()` for toast element assertions
- Keep tests focused — don't duplicate login flow testing

## Files to Touch
- `apps/console-e2e/src/auth-loading.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: S

## Progress Log
