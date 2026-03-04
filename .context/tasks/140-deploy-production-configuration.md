# Task: Production Runtime Configuration

## Status: pending

## Goal
Configure Angular SSR runtime API URL injection, update `.env.example` with all production variables, run admin seed in production, and set up Supabase keep-alive cron.

## Context
Phase 3 of epic-production-deployment. Handles all runtime configuration, environment documentation, one-time setup tasks, and database keep-alive to prevent Supabase free-tier pause.

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
- [ ] Supabase pooled URL format example included
- [ ] `CORS_ORIGINS` format documented (comma-separated)

### Admin Seed in Production
- [ ] Process documented: run `prisma db seed` via Railway CLI or Railway shell
- [ ] Idempotent seed verified — safe to run multiple times
- [ ] Steps added to `.context/runbook-production.md`

### Supabase Keep-Alive
- [ ] GitHub Actions cron workflow created (`.github/workflows/keep-alive.yml`)
- [ ] Runs daily (e.g., `cron: '0 8 * * *'`)
- [ ] Calls `GET https://api.example.com/api/health` (or production API URL)
- [ ] Prevents Supabase free-tier from pausing after 1 week inactivity
- [ ] Workflow uses repository secret for production API URL

## Technical Notes
- SSR API URL injection options: (1) `process.env.API_URL` in `server.ts` passed via Express locals, (2) injected into `<script>` tag in rendered HTML, (3) Angular transfer state
- Keep-alive cron: simple `curl` in GitHub Actions, no complex logic needed
- Admin seed: Railway CLI (`railway run pnpm prisma db seed`) or Railway shell in dashboard
- `.env.example` should NOT contain real secrets — only format examples

## Files to Touch
- `apps/landing/server.ts` (or `src/main.server.ts` — read actual SSR entry point)
- `.env.example` (update)
- `.github/workflows/keep-alive.yml` (new)
- `.context/runbook-production.md` (admin seed + keep-alive sections)

## Dependencies
- [133] Health Check Endpoint (keep-alive target)
- [137] Supabase Production Database (keep-alive prevents pause)
- [138] Railway Project Setup (admin seed runs on Railway)

## Complexity: M

## Progress Log
