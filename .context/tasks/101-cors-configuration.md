# Task: Configure CORS for Cross-Subdomain Auth

## Status: done

## Goal
Enable CORS on the NestJS API so the console app (`console.phuong.com` / `localhost:4300`) can make credentialed requests.

## Context
The console app runs on a different origin than the API. Without CORS + `credentials: true`, the browser won't send `refresh_token` cookies or allow cross-origin responses. This is a blocker for all frontend auth work.

## Acceptance Criteria
- [x] `app.enableCors()` added to `apps/api/src/main.ts` with `credentials: true`
- [x] Allowed origins read from environment config (with `localhost:4300` as dev default)
- [x] Wildcards NOT used (incompatible with `credentials: true`)
- [x] Integration test verifies CORS headers are present on responses
- [x] Existing API tests still pass

## Technical Notes
- Add to `apps/api/src/main.ts` after `app.setGlobalPrefix('api')`
- Use env var like `CORS_ORIGINS` (comma-separated) with fallback to `http://localhost:4300`
- Consider adding `http://localhost:4200` (landing) for future use

## Files to Touch
- `apps/api/src/main.ts`
- `apps/api/src/config/` (if env config pattern exists)

## Dependencies
- None (first task, unblocks everything)

## Complexity: S
