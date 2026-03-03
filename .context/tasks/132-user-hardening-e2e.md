# Task: User Hardening — E2E Tests

## Status: pending

## Goal
Write end-to-end tests covering the new user management flows: invite flow, set-password, soft-delete, admin page, and Google SSO restriction.

## Context
Final task of epic-user-module-hardening. All backend and frontend features must be complete. Tests validate the full user journey.

## Acceptance Criteria

### Invite & Set-Password Flow
- [ ] Admin can invite a user via the admin page dialog
- [ ] Invited user receives set-password page via direct URL (with token + userId)
- [ ] User sets password successfully and is redirected to login
- [ ] User can log in with the set password
- [ ] Invalid/expired token shows error on set-password page

### Soft-Delete Flow
- [ ] Admin can soft-delete a user from the admin page
- [ ] Confirmation dialog appears and can be cancelled
- [ ] Soft-deleted user cannot log in (appropriate error shown)
- [ ] Soft-deleted user shown with visual distinction in admin list

### Admin Page
- [ ] Admin user sees and can access `/admin/users`
- [ ] Non-admin user is redirected away from `/admin/users`
- [ ] User list displays with pagination
- [ ] Search filters users by name/email

### Auth Guards
- [ ] Unauthenticated user cannot access user endpoints (API returns 401)
- [ ] Non-admin user cannot access admin-only endpoints (API returns 403)
- [ ] Regular user can access own profile but not others'

### Google SSO Restriction
- [ ] Google login with unknown email shows invite-only error message

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
