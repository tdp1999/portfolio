# Task: Setup HttpClient and API Configuration

## Status: done

## Goal
Configure Angular's `HttpClient` with `withFetch()` in the console app and create a reusable API service with base URL configuration, following the notum `ApiService` pattern.

## Context
The console app currently has no `provideHttpClient()` in `app.config.ts`. All auth features depend on HTTP calls to the API. Instead of a bare injection token, we create a full `ApiService` wrapper (like `notum/libs/shared/features/api`) inside the existing `console-shared-data-access` lib.

## Acceptance Criteria
- [x] `provideHttpClient(withFetch(), withInterceptors([...]))` added to `app.config.ts`
- [x] `ApiConfig` interface with `baseUrl`, `urlPrefix`, `timeout`
- [x] `API_CONFIG` injection token created in `libs/console/shared/data-access/`
- [x] `provideApi(config)` helper function for clean provider setup
- [x] `ApiService` with typed `get`, `post`, `put`, `patch`, `delete` methods, `withCredentials: true`
- [x] Base URL built from config (`baseUrl/urlPrefix/endpoint`)
- [x] Interceptor array is empty for now (wired in later tasks)
- [x] Environment files created with API base URL
- [x] Unit tests for `ApiService`

## Technical Notes
- Reference: `C:\study\notum\libs\shared\features\api\src`
- Put everything in existing `libs/console/shared/data-access/src/lib/api/`
- Use `InjectionToken<ApiConfig>` for `API_CONFIG`
- Provide via `provideApi()` in `app.config.ts`
- Create `environment.ts` / `environment.development.ts` in console app

## Files to Touch
- `libs/console/shared/data-access/src/lib/api/api.config.ts` (interface + token)
- `libs/console/shared/data-access/src/lib/api/api.service.ts`
- `libs/console/shared/data-access/src/lib/api/api.provider.ts`
- `libs/console/shared/data-access/src/lib/api/api.service.spec.ts`
- `libs/console/shared/data-access/src/index.ts` (exports)
- `apps/console/src/environments/environment.ts`
- `apps/console/src/environments/environment.development.ts`
- `apps/console/src/app/app.config.ts`

## Dependencies
- None

## Complexity: S
