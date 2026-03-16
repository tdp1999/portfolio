# Task: User Hardening — E2E Tests

## Status: done

## Goal
Write end-to-end tests covering the new user management flows: invite flow, set-password, soft-delete, admin page, and Google SSO restriction.

## Context
Final task of epic-user-module-hardening. All backend and frontend features must be complete. Tests validate the full user journey.

## Acceptance Criteria

### Invite & Set-Password Flow
- [x] Admin can invite a user via the admin page dialog
- [x] Invited user receives set-password page via direct URL (with token + userId)
- [x] User sets password successfully and is redirected to login
- [x] User can log in with the set password
- [x] Invalid/expired token shows error on set-password page

### Soft-Delete Flow
- [x] Admin can soft-delete a user from the admin page
- [x] Confirmation dialog appears and can be cancelled
- [x] Soft-deleted user cannot log in (appropriate error shown)
- [x] Soft-deleted user shown with visual distinction in admin list

### Admin Page
- [x] Admin user sees and can access `/admin/users`
- [x] Non-admin user is redirected away from `/admin/users`
- [x] User list displays with pagination
- [x] Search filters users by name/email

### Auth Guards
- [x] Unauthenticated user cannot access user endpoints (API returns 401)
- [x] Non-admin user cannot access admin-only endpoints (API returns 403)
- [x] Regular user can access own profile but not others'

### Google SSO Restriction
- [x] Google login with unknown email shows invite-only error message

## Technical Notes
- Follow existing E2E patterns from `apps/console-e2e/`
- Use POM pattern (page object model) per aqa-expert skill
- Seed an admin user and a regular user for test setup
- For invite flow: either intercept the email or call the API directly to get the token
- Google SSO test: mock OAuth callback with unknown email (follow existing Google OAuth E2E pattern)

## Files to Touch
- `apps/console-e2e/src/` (new spec files and page objects)

## Dependencies
- [124-131] All other hardening tasks must be complete

## Complexity: L

## Progress Log
- 2026-03-16: All 18 ACs covered. 58 tests passing. Created 3 new spec files (admin-page, invite-flow, soft-delete), 2 POMs (admin-users, set-password), extended auth-guards and auth-google specs. Added admin user seeding + adminPage fixture. Fixed 3 production bugs discovered during testing: Google OAuth error handling, login soft-delete bypass, missing error dictionary entries.
