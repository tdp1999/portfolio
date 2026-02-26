# Task: Implement Error Interceptor with Toast Integration

## Status: done

## Goal
Create an HTTP error interceptor that catches API errors and delegates to an app-level error handler.

## Context
API errors need to surface to the user automatically. The error interceptor catches errors and delegates to an `ERROR_HANDLER` injection token, keeping the `data-access` layer free of `ui` dependencies.

## Acceptance Criteria
- [x] Catches HTTP errors from API responses
- [x] Extracts `message` from the `DomainError` JSON response body
- [x] Shows error via `ToastService.error(message)` (in app-level handler)
- [x] Skips 401 errors (handled by refresh interceptor)
- [x] Shows "Network error" toast for connection failures (status 0)
- [x] Does not show toast for cancelled requests (AbortError)
- [x] Registered in `withInterceptors([...])` in `app.config.ts`
- [x] Blocking errors (403, 404, 500) navigate to `/error/:code` with blank layout
- [x] `SKIP_ERROR_HANDLING` HttpContext token for per-request bypass
- [x] `ERROR_HANDLER` injection token — interceptor delegates, app layer provides implementation
- [x] Unit tests (interceptor + app-level handler)

## Technical Notes
- Interceptor is outermost in the chain
- `ERROR_HANDLER` interface in `data-access`, implementation in `apps/console`
- Error pages use blank layout at `/error/:code`

## Files
- `libs/console/shared/data-access/src/lib/interceptors/error-handler.ts` (interface + token)
- `libs/console/shared/data-access/src/lib/interceptors/error.interceptor.ts`
- `libs/console/shared/data-access/src/lib/interceptors/error.interceptor.spec.ts`
- `apps/console/src/app/error-handler.provider.ts` (implementation)
- `apps/console/src/app/error-handler.provider.spec.ts`
- `apps/console/src/app/pages/error/error-page.ts`
- `apps/console/src/app/app.config.ts`
- `apps/console/src/app/app.routes.ts`

## Dependencies
- 104-auth-interceptors (same interceptor chain)
- 106-toast-service

## Complexity: S
