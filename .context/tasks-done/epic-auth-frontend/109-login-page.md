# Task: Build Login Page

## Status: done

## Goal
Implement the login page with email/password form, "Remember Me" checkbox, Google SSO button, and forgot password link.

## Context
The login page stub exists at `apps/console/src/app/pages/auth/login/login.ts`. It needs a full form with validation, auth integration, and proper UX feedback.

## Acceptance Criteria
- [x] Email input with validation (required, email format)
- [x] Password input with validation (required) and show/hide toggle
- [x] "Remember Me" checkbox (default unchecked)
- [x] Submit button with loading state (disabled + spinner while submitting)
- [x] Calls `AuthStore.login()` on submit
- [x] On success: redirects to return URL or `/` with success toast
- [x] On error: shows error toast (handled by error interceptor)
- [x] "Forgot Password?" link navigates to `/auth/forgot-password`
- [x] Google SSO button — redirects to `/api/auth/google` (full page redirect)
- [x] Form uses reactive forms with typed `FormGroup`
- [x] Responsive layout (centered card on blank layout)
- [x] Visual design follows console app aesthetic (Tailwind)

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

## Progress Log
- [2026-02-26] Started and completed all acceptance criteria

## Complexity: M
