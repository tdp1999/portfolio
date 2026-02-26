# Task: Build OAuth Callback Page

## Status: done

## Goal
Implement the `/auth/callback` page that handles the Google OAuth redirect, parses the access token, and bootstraps the session.

## Context
After Google OAuth, the API redirects to `FRONTEND_URL/auth/callback#token=<accessToken>`. This page must extract the token from the URL fragment, store it in the AuthStore, fetch the current user, and redirect to the dashboard.

## Acceptance Criteria
- [x] Route `/auth/callback` added to `app.routes.ts` (under blank layout)
- [x] Component reads `#token=<value>` from URL fragment
- [x] Stores token in AuthStore via a dedicated method (e.g., `setAccessToken()`)
- [x] Calls `AuthStore.fetchCurrentUser()` to populate user state
- [x] On success: clears URL fragment via `window.history.replaceState()`, redirects to `/`
- [x] On failure (no token or fetch fails): redirects to `/auth/login` with error toast
- [x] Shows full-page spinner while processing
- [x] No sensitive data remains in URL after processing

## Technical Notes
- URL fragment (`#token=...`) is never sent to the server — safe from server logs
- Use `ActivatedRoute.fragment` observable or `window.location.hash`
- `window.history.replaceState({}, '', '/auth/callback')` to clear the fragment
- This page should be very brief — user sees spinner for <1 second

## Files to Touch
- `apps/console/src/app/pages/auth/callback/callback.ts` (new)
- `apps/console/src/app/app.routes.ts`

## Dependencies
- 103-auth-store
- 107-loading-indicators (full-page spinner)

## Complexity: S
