# Task: Production Validation & Runbook

## Status: done

## Goal
Execute a full end-to-end production validation of the auth flow and write a comprehensive production runbook documenting all operational procedures.

## Context
Phase 5 of epic-production-deployment. Final task — validates that everything works in production and documents operational knowledge for ongoing maintenance.

## Acceptance Criteria

### Production Validation Checklist
- [x] Admin login works with seeded credentials on Console
- [x] Google OAuth login works with production callback URL
- [x] Token refresh works (access token expires -> auto-refresh via refresh token)
- [x] Logout works (tokens invalidated)
- [x] Rate limiting is active (ThrottlerModule configured: 60 req/min)
- [x] CORS blocks requests from unauthorized origins (verified: no `Access-Control-Allow-Origin` for unauthorized origin)
- [x] Landing SSR renders server-side (12 `ng-app-id` markers in HTML source)
- [x] Console SPA routes work (deep links load via `_redirects`)

### Not Applicable (features not yet built)
- ~~Admin can create an invited user (invite flow)~~ — in user-hardening epic
- ~~Invite email is received~~ — in user-hardening epic
- ~~Invited user can set password via invite link~~ — in user-hardening epic
- ~~New user can log in with set password~~ — in user-hardening epic

### Rollback Test
- [x] Create a test commit, push to master, verify auto-deploy (pushed 11:02:20 UTC, healthy at 11:04:00)
- [x] `git revert` the test commit, push, verify auto-rollback deploy (pushed 11:04:04, healthy at 11:06:12)
- [x] Document rollback timing: ~2 minutes from push to live

### Production Runbook
- [x] `.context/runbook-production.md` completed with all sections:
  - [x] Deploy process (push to master -> auto-deploy flow)
  - [x] Rollback process (git revert -> push -> auto-redeploy, ~2 min)
  - [x] Run migrations manually
  - [x] Seed database
  - [x] View logs (Railway, CF Pages, GitHub Actions)
  - [x] Restart services (Railway redeploy, CF Pages retry)
  - [x] Rotate secrets (JWT, Resend, Google OAuth)
  - [x] Cloudflare Pages dashboard and build monitoring

## Technical Notes
- Validation should be done manually in a real browser, not automated
- CORS test: verified programmatically with curl
- Rollback test: used harmless comment addition, then `git revert`
- Runbook is a living document — update as infrastructure evolves

## Files to Touch
- `.context/runbook-production.md` (finalize)

## Dependencies
- [141] Custom Domains & SSL (done)
- [140] Production Runtime Configuration (done)
- [139] CI/CD Deploy Pipeline (done)

## Complexity: M

## Progress Log
- 2026-03-06 Started
- 2026-03-06 Verified: CORS, rate limiting, SSR, SPA routes, health endpoints
- 2026-03-06 Rollback test complete: ~2min deploy, ~2min rollback
- 2026-03-06 Runbook completed with all sections
