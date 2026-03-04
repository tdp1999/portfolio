# Task: Health Check Endpoint

## Status: done

## Goal
Add a `GET /api/health` endpoint to the NestJS API that reports application and database health. Used by Railway for service health monitoring and post-deploy smoke tests.

## Context
Phase 1 of epic-production-deployment. This is the first task because it's a prerequisite for Railway health checks, CI/CD smoke tests, and Supabase keep-alive cron. No auth required.

## Acceptance Criteria
- [x] `GET /api/health` endpoint exists, no authentication required
- [x] Returns `{ status: 'ok', db: 'connected' | 'error', timestamp: string }`
- [x] Performs a `SELECT 1` query via Prisma to verify database connectivity
- [x] Returns HTTP 200 when healthy, HTTP 503 when database is unreachable
- [x] Response `timestamp` is ISO 8601 format
- [x] Endpoint is excluded from rate limiting (throttler is opt-in per endpoint)
- [x] Unit test covers healthy and unhealthy (Prisma throws) scenarios
- [ ] Manually verified via `curl http://localhost:3000/api/health`

## Technical Notes
- Create a dedicated `HealthController` (or add to an existing top-level controller)
- Use Prisma `$queryRaw` or `$executeRaw` for `SELECT 1` — avoid loading entities
- Wrap DB check in try/catch — never let health endpoint crash
- No error logic in controller — but health check is an exception to the "no errors in controllers" rule since it's infrastructure, not domain logic

## Files to Touch
- `apps/api/src/modules/health/health.controller.ts` (new)
- `apps/api/src/modules/health/health.controller.spec.ts` (new)
- `apps/api/src/modules/health/health.module.ts` (new)
- `apps/api/src/app.module.ts` (import HealthModule)

## Dependencies
None — this is the first infrastructure task.

## Complexity: S

## Progress Log
