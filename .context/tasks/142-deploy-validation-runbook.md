# Task: Production Validation & Runbook

## Status: pending

## Goal
Execute a full end-to-end production validation of the auth flow and write a comprehensive production runbook documenting all operational procedures.

## Context
Phase 5 of epic-production-deployment. Final task — validates that everything works in production and documents operational knowledge for ongoing maintenance.

## Acceptance Criteria

### Production Validation Checklist
- [ ] Admin login works with seeded credentials on Console
- [ ] Admin can create an invited user (invite flow)
- [ ] Invite email is received (SMTP working in production)
- [ ] Invited user can set password via invite link
- [ ] New user can log in with set password
- [ ] Google OAuth login works with production callback URL
- [ ] Token refresh works (access token expires → auto-refresh via refresh token)
- [ ] Logout works (tokens invalidated)
- [ ] Rate limiting is active (`NODE_ENV=production`)
- [ ] CORS blocks requests from unauthorized origins (test from different origin)
- [ ] Landing SSR renders server-side (view source shows HTML content)
- [ ] Console SPA routes work (deep links, browser refresh)

### Rollback Test
- [ ] Create a test commit, push to master, verify auto-deploy
- [ ] `git revert` the test commit, push, verify auto-rollback deploy
- [ ] Document rollback timing (how long from revert push to live rollback)

### Production Runbook
- [ ] `.context/runbook-production.md` completed with all sections:
  - Deploy process (push to master → auto-deploy flow)
  - Rollback process (git revert → push → auto-redeploy)
  - Run migrations manually (`railway run prisma migrate deploy`)
  - Seed database (`railway run pnpm prisma db seed`)
  - View logs (Railway log viewer, CF Pages build logs)
  - Restart services (Railway dashboard)
  - Rotate secrets (`openssl rand -base64 32`, update env vars, restart)
  - Supabase dashboard access and monitoring
  - Cloudflare Pages dashboard and build monitoring
  - Emergency contacts / escalation (N/A for solo project, but placeholder)

## Technical Notes
- Validation should be done manually in a real browser, not automated
- Test rate limiting by hitting login endpoint rapidly from a tool like `curl`
- CORS test: open browser console on a different domain, try `fetch('https://api.example.com/api/health')`
- Rollback test: use a harmless change (e.g., update a comment in health check)
- Runbook is a living document — update as infrastructure evolves

## Files to Touch
- `.context/runbook-production.md` (finalize)

## Dependencies
- [141] Custom Domains & SSL (all domains configured)
- [140] Production Runtime Configuration (all env vars set)
- [139] CI/CD Deploy Pipeline (deploy pipeline working)

## Complexity: M

## Progress Log
