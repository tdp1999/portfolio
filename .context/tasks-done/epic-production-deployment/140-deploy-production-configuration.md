# Task: Production Runtime Configuration

## Status: done

## Goal
Document all production environment variables and admin seed process.

## Context
Phase 3 of epic-production-deployment. **Updated:** Landing is deployed as static site on Cloudflare Pages (not SSR on Railway), so runtime API URL injection is not needed. Console bakes API URL at build time.

## Acceptance Criteria

### Environment Documentation
- [x] `.env.example` updated with all production-required variables
- [x] Variables grouped by service: API, Console (build-time)
- [x] Each variable has a descriptive comment
- [x] Railway Postgres connection string format example included
- [x] `CORS_ORIGINS` format documented (comma-separated)

### Admin Seed in Production
- [x] Process documented in `.context/runbook-production.md`
- [x] Idempotent seed verified — safe to run multiple times
- [x] Seed runs automatically on deploy (Dockerfile CMD)

### Not Applicable (revised)
- ~~Landing SSR reads `API_URL` from `process.env` at runtime~~ — Landing is on CF Pages (static), not Railway SSR

## Complexity: M

## Progress Log
- 2026-03-06: Revised ACs — Landing is static on CF Pages. Updated .env.example and runbook.
