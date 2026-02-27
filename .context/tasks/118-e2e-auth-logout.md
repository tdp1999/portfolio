# Task: E2E Logout Tests

## Status: pending

## Goal
E2E tests for logout and logout-all flows.

## Context
Verifies that logout clears session and redirects, and logout-all invalidates all sessions.

## Acceptance Criteria
- [ ] `auth-logout.spec.ts` created
- [ ] Happy: logout → redirected to login, dashboard inaccessible
- [ ] Happy: logout-all → token version bumped, other sessions invalid
- [ ] Cookie: refresh token cookie cleared after logout

## Technical Notes
- Use `authenticatedPage` fixture for pre-logged-in state
- For logout-all, may need two browser contexts to simulate multiple sessions

## Files to Touch
- `apps/console-e2e/src/auth-logout.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: M

## Progress Log
