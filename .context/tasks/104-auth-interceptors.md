# Task: Implement HTTP Interceptors (Auth, Refresh, CSRF)

## Status: pending

## Goal
Create three functional interceptors: auth header attachment, automatic token refresh on 401, and CSRF token forwarding.

## Context
The interceptors are the glue between the AuthStore and the API. They handle token attachment, silent refresh on expiry, and CSRF protection — all transparently to consuming code.

## Acceptance Criteria
- [ ] **Auth interceptor:** Attaches `Authorization: Bearer <token>` to API requests. Skips public auth endpoints (login, refresh, forgot-password, reset-password, google)
- [ ] **Refresh interceptor:** On 401 response, calls `AuthStore.refreshToken()`. If refresh succeeds, retries original request with new token. If refresh fails, redirects to `/auth/login` with toast. Queues concurrent requests during refresh (no duplicate refresh calls). Skips 401 from `/auth/refresh` itself (prevents infinite loop)
- [ ] **CSRF interceptor:** For POST to `/api/auth/refresh`, reads `csrf_token` cookie from `document.cookie` and attaches as `X-CSRF-Token` header
- [ ] All three registered in `withInterceptors([...])` in `app.config.ts`
- [ ] Unit tests for each interceptor

## Technical Notes
- Use Angular's functional interceptor pattern (`HttpInterceptorFn`)
- Refresh queue: use a `BehaviorSubject<boolean>` to track refresh-in-progress, queue with `switchMap`
- Reading cookies: simple `document.cookie.split()` helper — no library needed
- Interceptor order matters: CSRF → Auth → Refresh (CSRF adds header, Auth adds bearer, Refresh handles 401)

## Files to Touch
- `libs/console/shared/data-access/src/lib/interceptors/auth.interceptor.ts`
- `libs/console/shared/data-access/src/lib/interceptors/refresh.interceptor.ts`
- `libs/console/shared/data-access/src/lib/interceptors/csrf.interceptor.ts`
- `libs/console/shared/data-access/src/lib/interceptors/*.spec.ts`
- `apps/console/src/app/app.config.ts` (wire interceptors)
- `libs/console/shared/data-access/src/index.ts`

## Dependencies
- 103-auth-store

## Complexity: L
