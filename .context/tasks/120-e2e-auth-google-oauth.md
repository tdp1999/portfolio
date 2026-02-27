# Task: E2E Google OAuth Tests (Mocked)

## Status: pending

## Goal
E2E tests for Google OAuth callback flow using a simple mock approach.

## Context
Real Google OAuth can't be tested in E2E. We simulate the callback by navigating directly to the callback URL with a mock token, or by intercepting the Google redirect.

## Acceptance Criteria
- [ ] `auth-google.spec.ts` created
- [ ] Happy: simulated callback with valid token → user logged in, redirected to dashboard
- [ ] Unhappy: callback with no/invalid token → redirected to login with error
- [ ] UI: Google-only user has no "Change Password" option visible

## Technical Notes
- Simplest approach: use `page.route()` to intercept the Google OAuth redirect and return a mock response
- Or navigate directly to `/auth/callback?code=mock-code` and mock the API token exchange
- Google-only user seeded in global setup (task 116)
- Keep it simple — focus on verifying the basic flow works

## Files to Touch
- `apps/console-e2e/src/auth-google.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: M

## Progress Log
