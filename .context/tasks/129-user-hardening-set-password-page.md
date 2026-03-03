# Task: Frontend — Set-Password Page for Invited Users

## Status: pending

## Goal
Create a set-password page at `/auth/set-password` so invited users can set their password via the email invite link.

## Context
Part of epic-user-module-hardening Phase 5 (Frontend). Mirrors the existing reset-password page UX but calls `POST /auth/set-password` instead. Invite emails contain a link with `token` and `userId` query params.

## Acceptance Criteria
- [ ] New page component at `/auth/set-password` route
- [ ] Reads `token` and `userId` from query params
- [ ] Form fields: new password + confirm password with validation (matching existing password rules)
- [ ] Calls `POST /auth/set-password` with `{ token, userId, newPassword }`
- [ ] On success: redirects to `/auth/login` with success toast ("Password set successfully. You can now log in.")
- [ ] On error (invalid/expired token): shows clear error message on page
- [ ] Accessible without authentication (add to guest routes, similar to reset-password)
- [ ] Follows existing reset-password page patterns and landing-* component usage rules
- [ ] Unit tests for the component

## Technical Notes
- Mirror `libs/console/feature-auth/src/lib/reset-password/` structure closely
- Route added in `libs/console/feature-auth/src/lib/auth.routes.ts`
- Use guestGuard (same as other auth pages)
- API method added to auth store or a dedicated service

## Files to Touch
- `libs/console/feature-auth/src/lib/set-password/` (new directory + component)
- `libs/console/feature-auth/src/lib/auth.routes.ts`
- `libs/console/shared/data-access/src/lib/auth.store.ts` (add setPassword method)

## Dependencies
- [126] Functional (set-password API endpoint must exist)

## Complexity: S

## Progress Log
