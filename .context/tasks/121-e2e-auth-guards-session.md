# Task: E2E Route Guards & Session Tests

## Status: pending

## Goal
E2E tests for route protection (auth/guest guards) and session persistence behavior.

## Context
Verifies that unauthenticated users can't access protected routes, authenticated users are redirected away from auth pages, and deep links work after login.

## Acceptance Criteria
- [ ] `auth-guards.spec.ts` created
- [ ] Unauthenticated → `/dashboard` redirects to `/auth/login`
- [ ] Authenticated → `/auth/login` redirects to `/dashboard`
- [ ] Deep link: visit protected URL while logged out → after login, redirected to original page
- [ ] `auth-session.spec.ts` created
- [ ] Expired session: manipulate cookie to simulate expiry → redirect to login with toast
- [ ] Return URL preserved through auth flow

## Technical Notes
- Use `page.context().clearCookies()` to simulate logged-out state
- For expired session, can delete/modify the refresh token cookie
- Deep link test: go to `/dashboard/settings` → redirected to login → login → land on `/dashboard/settings`

## Files to Touch
- `apps/console-e2e/src/auth-guards.spec.ts`
- `apps/console-e2e/src/auth-session.spec.ts`

## Dependencies
- 116-e2e-auth-infrastructure

## Complexity: M

## Progress Log
