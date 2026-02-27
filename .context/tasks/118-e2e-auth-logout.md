# Task: E2E Logout Tests

## Status: done

## Goal
E2E tests for logout and logout-all flows.

## Context
Verifies that logout clears session and redirects, and logout-all invalidates all sessions.

## Acceptance Criteria
- [x] `auth-logout.spec.ts` created
- [x] Happy: logout → redirected to login, dashboard inaccessible
- [x] Happy: logout-all → token version bumped, other sessions invalid
- [x] Cookie: refresh token cookie cleared after logout

## Technical Notes
- Use `authenticatedPage` fixture for pre-logged-in state
- For logout-all, may need two browser contexts to simulate multiple sessions

## Files to Touch
- `apps/console-e2e/src/auth-logout.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: M

## Progress Log
- [2026-02-27] Started — created auth-logout.spec.ts with logout redirect/cookie and logout-all multi-session tests
