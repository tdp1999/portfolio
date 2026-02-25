# Task: Implement Error Interceptor with Toast Integration

## Status: pending

## Goal
Create an HTTP error interceptor that catches API errors and displays them as toast notifications.

## Context
API errors need to surface to the user automatically. The error interceptor catches non-401 errors (401 is handled by the refresh interceptor) and shows the error message via the toast service.

## Acceptance Criteria
- [ ] Catches HTTP errors from API responses
- [ ] Extracts `message` from the `DomainError` JSON response body
- [ ] Shows error via `ToastService.error(message)`
- [ ] Skips 401 errors (handled by refresh interceptor)
- [ ] Shows "Network error" toast for connection failures (status 0)
- [ ] Does not show toast for cancelled requests (`HttpErrorResponse` with status 0 and `statusText: 'Unknown Error'` vs abort)
- [ ] Registered in `withInterceptors([...])` in `app.config.ts`
- [ ] Unit tests

## Technical Notes
- Order: this interceptor should be outermost (catches errors after refresh interceptor has had its chance)
- API error body shape: `{ name: "DomainError", statusCode, errorCode, error, message, remarks }`
- Use `message` field for the toast text

## Files to Touch
- `libs/console/shared/data-access/src/lib/interceptors/error.interceptor.ts`
- `libs/console/shared/data-access/src/lib/interceptors/error.interceptor.spec.ts`
- `apps/console/src/app/app.config.ts` (add to interceptor chain)

## Dependencies
- 104-auth-interceptors (same interceptor chain)
- 106-toast-service

## Complexity: S
