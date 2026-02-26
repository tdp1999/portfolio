# Task: Implement Signal-Based AuthStore Service

## Status: completed

## Goal
Create the core `AuthStore` service that manages authentication state using Angular Signals.

## Context
Central auth state management for the console app. Holds current user, access token (in memory), and auth status. All components and guards will read from this store.

## Acceptance Criteria
- [x] `AuthStore` service created in `libs/console/shared/data-access/`
- [x] Signals: `user` (writable), `isAuthenticated` (computed), `isBootstrapping` (writable)
- [x] Methods: `login(email, password, rememberMe)`, `loginWithGoogle()`, `logout()`, `logoutAll()`, `refreshToken()`, `fetchCurrentUser()`, `bootstrap()`
- [x] Access token stored as private class field (never in localStorage)
- [x] `getAccessToken()` method for interceptors to read token
- [x] `bootstrap()` attempts silent refresh → fetches `/auth/me` → sets user or clears state
- [x] Provided in root (singleton)
- [x] Unit tests cover: login success/failure, logout clears state, bootstrap with/without valid session
- [x] Exported from `@portfolio/console/shared/data-access`

## Technical Notes
- Use `ApiService` from `@portfolio/console/shared/data-access` (wraps HttpClient with base URL, withCredentials, timeout)
- Login: `api.post('/auth/login', credentials)` → store access token from response, set cookies handled by browser
- Google: redirect to `GET /api/auth/google` (full page redirect, use `window.location.href`)
- `/auth/me`: `api.get('/auth/me')`, returns user profile
- Bootstrap flow: `refreshToken()` → if success, `fetchCurrentUser()` → if fail, user stays null
- Handle the "no refresh cookie" case gracefully (401 from refresh = not logged in, not an error)

## Files to Touch
- `libs/console/shared/data-access/src/lib/auth.store.ts`
- `libs/console/shared/data-access/src/lib/auth.store.spec.ts`
- `libs/console/shared/data-access/src/index.ts`

## Dependencies
- 102-console-http-setup

## Complexity: L
