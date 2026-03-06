# Task: CI/CD Deploy Pipeline

## Status: done

## Goal
Ensure production deployments are automated on `master` push with post-deploy verification.

## Context
Phase 2 of epic-production-deployment. Railway and Cloudflare Pages both auto-deploy via their own GitHub integrations. CI runs tests independently. A separate smoke test workflow verifies production health after deploy.

## Acceptance Criteria
- [x] Railway auto-deploys API on `master` push via GitHub integration
- [x] Cloudflare Pages auto-deploys Console + Landing on `master` push via GitHub integration
- [x] CI workflow (`.github/workflows/ci.yml`) runs lint, test, build, and E2E on push/PR
- [x] Production `prisma migrate deploy` runs as part of API container startup (Dockerfile CMD)
- [x] Post-deploy smoke test workflow (`.github/workflows/deploy.yml`) triggers on `master` push
- [x] Smoke test hits `GET /api/health` and `GET /api/health/db` with retries and backoff
- [x] Smoke test fails workflow if health check returns non-200 after retries
- [x] Deploy secrets stored as GitHub repository secrets (`PRODUCTION_API_URL`)
- [x] Workflow documented in `.context/runbook-production.md`

## Technical Notes
- Railway and CF Pages GitHub integrations handle deployment — no explicit deploy step in CI
- Smoke test is a separate workflow from CI (runs in parallel, not gated on CI)
- Migration runs inside Docker CMD — if migration fails, container fails to start, Railway marks deploy as failed

## Complexity: M

## Progress Log
- 2026-03-06: Verified all criteria. Smoke test workflow exists. Runbook created.
