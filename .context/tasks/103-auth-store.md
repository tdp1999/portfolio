# Task: Implement Signal-Based AuthStore Service

## Status: pending

## Goal
Create the core `AuthStore` service that manages authentication state using Angular Signals.

## Context
Central auth state management for the console app. Holds current user, access token (in memory), and auth status. All components and guards will read from this store.

## Acceptance Criteria
- [ ] `AuthStore` service created in `libs/console/shared/data-access/`
- [ ] Signals: `user` (writable), `isAuthenticated` (computed), `isBootstrapping` (writable)
- [ ] Methods: `login(email, password, rememberMe)`, `loginWithGoogle()`, `logout()`, `logoutAll()`, `refreshToken()`, `fetchCurrentUser()`, `bootstrap()`
- [ ] Access token stored as private class field (never in localStorage)
- [ ] `getAccessToken()` method for interceptors to read token
- [ ] `bootstrap()` attempts silent refresh → fetches `/auth/me` → sets user or clears state
- [ ] Provided in root (singleton)
- [ ] Unit tests cover: login success/failure, logout clears state, bootstrap with/without valid session
- [ ] Exported from `@portfolio/console/shared/data-access`

## Technical Notes
- Use `HttpClient` to call API endpoints
- Login: POST `/api/auth/login` → store access token from response, set cookies handled by browser
- Google: redirect to `GET /api/auth/google` (full page redirect)
- `/auth/me`: GET, returns user profile
- Bootstrap flow: `refreshToken()` → if success, `fetchCurrentUser()` → if fail, user stays null
- Handle the "no refresh cookie" case gracefully (401 from refresh = not logged in, not an error)

## Files to Touch
- `libs/console/shared/data-access/src/lib/auth.store.ts`
- `libs/console/shared/data-access/src/lib/auth.store.spec.ts`
- `libs/console/shared/data-access/src/index.ts`

## Dependencies
- 102-console-http-setup

## Complexity: L
