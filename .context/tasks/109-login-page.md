# Task: Build Login Page

## Status: pending

## Goal
Implement the login page with email/password form, "Remember Me" checkbox, Google SSO button, and forgot password link.

## Context
The login page stub exists at `apps/console/src/app/pages/auth/login/login.ts`. It needs a full form with validation, auth integration, and proper UX feedback.

## Acceptance Criteria
- [ ] Email input with validation (required, email format)
- [ ] Password input with validation (required) and show/hide toggle
- [ ] "Remember Me" checkbox (default unchecked)
- [ ] Submit button with loading state (disabled + spinner while submitting)
- [ ] Calls `AuthStore.login()` on submit
- [ ] On success: redirects to return URL or `/` with success toast
- [ ] On error: shows error toast (handled by error interceptor)
- [ ] "Forgot Password?" link navigates to `/auth/forgot-password`
- [ ] Google SSO button — redirects to `/api/auth/google` (full page redirect)
- [ ] Form uses reactive forms with typed `FormGroup`
- [ ] Responsive layout (centered card on blank layout)
- [ ] Visual design follows console app aesthetic (Tailwind)

## Technical Notes
- Use Angular reactive forms (`FormGroup`, `FormControl`)
- Google SSO: `window.location.href = apiBaseUrl + '/api/auth/google'` — not an Angular route
- The blank layout already exists (`ConsoleBlankLayoutComponent`)
- Remove the signup stub — there's no registration flow (users created via API/Google only)

## Files to Touch
- `apps/console/src/app/pages/auth/login/login.ts`
- Remove: `apps/console/src/app/pages/auth/signup/signup.ts`
- `apps/console/src/app/app.routes.ts` (remove signup route)

## Dependencies
- 103-auth-store
- 106-toast-service

## Complexity: M
