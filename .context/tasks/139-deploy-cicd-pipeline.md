# Task: CI/CD Deploy Pipeline

## Status: pending

## Goal
Extend the existing GitHub Actions CI workflow with deploy jobs that trigger Railway and Cloudflare Pages deployments on `master` push, run production migrations, and execute post-deploy smoke tests.

## Context
Phase 2 of epic-production-deployment. Currently CI runs tests on PRs/pushes. This task adds deploy steps that only run on `master` push after all tests pass. Railway handles API + Landing deploys; CF Pages auto-deploys Console.

## Acceptance Criteria
- [ ] Deploy job added to `.github/workflows/ci.yml` (or separate `deploy.yml`)
- [ ] Deploy triggers only on `master` push (not PRs, not other branches)
- [ ] Deploy depends on `ci` and `e2e` jobs passing
- [ ] Railway deployment triggered via Railway GitHub integration or CLI (`railway up`)
- [ ] Production `prisma migrate deploy` runs as part of API container startup (CMD in Dockerfile)
- [ ] Post-deploy smoke test job: hits `GET /api/health` on production URL
- [ ] Smoke test retries with backoff (handles Railway cold start, up to 30s)
- [ ] Smoke test fails the workflow if health check returns non-200 after retries
- [ ] Cloudflare Pages auto-deploys via its own GitHub integration (document, no CI config needed)
- [ ] Deploy secrets stored as GitHub repository secrets (RAILWAY_TOKEN, production URLs)
- [ ] Workflow documented in `.context/runbook-production.md`

## Technical Notes
- Railway GitHub integration may auto-deploy on push — in that case, CI deploy job just triggers smoke test
- Alternative: use `railwayapp/cli-action` GitHub Action for explicit deploy control
- Smoke test: `curl --retry 5 --retry-delay 5 --retry-max-time 60 -f https://api.example.com/api/health`
- CF Pages has its own GitHub integration — connects directly, no CI action needed
- Consider separating deploy workflow from CI if it gets complex
- Migration runs inside Docker CMD — if migration fails, container fails to start, Railway marks deploy as failed

## Files to Touch
- `.github/workflows/ci.yml` (extend) or `.github/workflows/deploy.yml` (new)
- `.context/runbook-production.md` (CI/CD section)

## Dependencies
- [133] Health Check Endpoint (smoke test target)
- [138] Railway Project Setup (deploy target must exist)
- [136] Cloudflare Pages Console Setup (must be connected to GitHub)

## Complexity: M

## Progress Log
