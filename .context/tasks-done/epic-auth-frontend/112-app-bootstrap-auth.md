# Task: Wire Auth Bootstrap into App Initialization

## Status: done

## Goal
Integrate the AuthStore bootstrap flow into the console app's initialization so auth state is resolved before any route renders.

## Context
On every app load, the console must attempt a silent refresh to determine if the user is authenticated. Until this resolves, a full-page spinner is shown. Route guards must wait for bootstrap to complete.

## Acceptance Criteria
- [x] `APP_INITIALIZER` (or `provideAppInitializer`) calls `AuthStore.bootstrap()`
- [x] Full-page spinner shown while bootstrapping
- [x] If refresh succeeds: user populated, spinner hidden, route guards allow navigation
- [x] If refresh fails (no session): spinner hidden, guards redirect to login
- [x] Bootstrap doesn't throw — failure is a normal "not logged in" state
- [x] Tested: app starts correctly in both authenticated and unauthenticated states

## Technical Notes
- Use `provideAppInitializer()` (Angular 21+) in `app.config.ts`
- The initializer should return a Promise that resolves when bootstrap is complete
- `AuthStore.bootstrap()`: try refresh → if 401, resolve with null user → if success, fetch `/auth/me`
- The full-page spinner is controlled by `AuthStore.isBootstrapping` signal

## Files to Touch
- `apps/console/src/app/app.config.ts`
- `apps/console/src/app/app.ts` (add full-page spinner conditionally)

## Dependencies
- 103-auth-store
- 104-auth-interceptors
- 105-route-guards
- 107-loading-indicators

## Complexity: M
