# Task: Production Runtime Configuration

## Status: pending

## Goal
Configure Angular SSR runtime API URL injection, update `.env.example` with all production variables, and run admin seed in production.

## Context
Phase 3 of epic-production-deployment. Handles runtime configuration, environment documentation, and one-time setup tasks. **Updated:** Supabase keep-alive cron removed — Railway Postgres doesn't pause.

## Acceptance Criteria

### Angular SSR Runtime API URL
- [ ] Landing SSR server reads `API_URL` from `process.env` at runtime
- [ ] API URL is passed to Angular app (via transfer state, server-side injection, or `index.html` script tag)
- [ ] No build-time API URL hardcoding in Landing app
- [ ] Changing `API_URL` env var on Railway changes the API target without rebuilding

### Environment Documentation
- [ ] `.env.example` updated with all production-required variables
- [ ] Variables grouped by service: API, Landing, Console (build-time)
- [ ] Each variable has a descriptive comment
- [ ] Railway Postgres connection string format example included
- [ ] `CORS_ORIGINS` format documented (comma-separated)

### Admin Seed in Production
- [ ] Process documented: run `prisma db seed` via Railway CLI or Railway shell
- [ ] Idempotent seed verified — safe to run multiple times
- [ ] Steps added to `.context/runbook-production.md`

## Technical Notes
- SSR API URL injection options: (1) `process.env.API_URL` in `server.ts` passed via Express locals, (2) injected into `<script>` tag in rendered HTML, (3) Angular transfer state
- Admin seed: Railway CLI (`railway run pnpm prisma db seed`) or Railway shell in dashboard
- `.env.example` should NOT contain real secrets — only format examples
- ~~Supabase keep-alive cron~~ removed — Railway Postgres doesn't pause after inactivity

## Files to Touch
- `apps/landing/server.ts` (or `src/main.server.ts` — read actual SSR entry point)
- `.env.example` (update)
- `.context/runbook-production.md` (admin seed section)

## Dependencies
- [133] Health Check Endpoint (done)
- [138] Railway Project Setup (done)

## Complexity: M

## Progress Log
