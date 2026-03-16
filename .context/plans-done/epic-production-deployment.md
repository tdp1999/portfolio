# Epic: Production Deployment (MVP)

## Summary

Deploy the full portfolio application to production. Railway hobby plan ($5/mo) for API + PostgreSQL. Cloudflare Pages (free) for Console SPA. Landing SSR TBD. Establish CI/CD pipeline from GitHub Actions, configure custom domain with subdomains, and validate the full MVP auth flow in a real environment.

## Why

The User module hardening (Epic 124-132) establishes a secure auth foundation. Deploying now validates the entire pipeline end-to-end — database migrations, admin seeding, JWT auth, Google OAuth, email flows — in a real environment before building content modules. Early deployment de-risks infrastructure and enables incremental feature delivery.

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| API hosting | Railway (free tier, $5/mo credit) | Simple container deploys, native Node.js, easy env vars, fast wake from sleep |
| Landing SSR hosting | Railway (same platform) | Angular SSR requires Node.js runtime; CF Workers incompatible with Express-based SSR |
| Console SPA hosting | Cloudflare Pages (free tier) | Static SPA — perfect fit for CDN. No cold starts, global edge, unlimited bandwidth |
| Database | Railway PostgreSQL (hobby plan) | Single platform for API + DB, no cross-provider networking, no pause issues |
| Budget | $5/mo (Railway hobby plan) + free tiers | Railway hobby plan covers API + Postgres; CF Pages free |
| Deploy scope | MVP Auth only (User + Auth modules) | Validates infra pipeline; content modules deploy incrementally |
| Domain layout | `example.com` (landing), `console.example.com` (console), `api.example.com` (API) | Standard subdomain pattern; actual domain configured via env vars |
| Rollback strategy | Git-based revert | Revert commit on master → CI/CD auto-deploys previous version |

## Target Architecture

```
[Custom Domain]
  ├── example.com            → Railway    (Angular SSR, Node.js)
  ├── console.example.com    → Cloudflare Pages (Angular SPA, static)
  └── api.example.com        → Railway    (NestJS API, Node.js)
                                  └── Railway PostgreSQL (hobby plan, internal networking)
```

Railway services deploy from GitHub repo on `master` push. Cloudflare Pages builds from the same repo.

## Scope

### In Scope

**Phase 1: Infrastructure Setup**
- Dockerfile for NestJS API (multi-stage, production build)
- Dockerfile for Angular SSR Landing (multi-stage, production build)
- Railway project configuration (two services: API + Landing SSR)
- Cloudflare Pages project configuration (Console SPA)
- Environment variable configuration on all platforms
- Railway PostgreSQL provisioned (internal networking, no pooler needed)
- Health check endpoint on API

**Phase 2: CI/CD Pipeline**
- Extend `.github/workflows/ci.yml` with deploy jobs
- Railway deploys triggered on `master` push (after CI passes)
- Cloudflare Pages auto-deploy on `master` push
- Production Prisma migration in deploy pipeline
- Post-deploy smoke test (health check)

**Phase 3: Production Configuration**
- Angular SSR runtime API URL configuration (env var, not build-time)
- Console SPA production environment file with correct API URL
- Update `.env.example` with all production-required variables
- Admin seed execution (one-time, idempotent)
- ~~Supabase free-tier keep-alive~~ (removed — Railway Postgres doesn't pause)

**Phase 4: Domain & SSL**
- Custom domain DNS for Railway (landing + API subdomains)
- Custom domain DNS for Cloudflare Pages (console subdomain)
- SSL/TLS (auto-provisioned by both platforms)
- CORS origins, Google OAuth callback, FRONTEND_URL updated for production

**Phase 5: Validation & Documentation**
- End-to-end production validation (full auth flow)
- Production runbook documentation

### Out of Scope

- Staging environment (add when team grows)
- Container orchestration (Kubernetes, Docker Swarm)
- Auto-scaling (free tier is single instance)
- APM / distributed tracing
- Blue-green or canary deployments
- Database backups automation
- Load testing
- CDN for API responses

## High-Level Requirements

### Phase 1: Infrastructure Setup

1. **Health check endpoint** — `GET /api/health` on API. Returns `{ status: 'ok', db: 'connected' | 'error', timestamp }`. Performs `SELECT 1` via Prisma. No auth required. Used by Railway for service health and post-deploy smoke tests.

2. **Dockerfile for API** — Multi-stage build: `node:20-alpine` base → install pnpm deps → `nx build api` → copy `dist/apps/api/` to slim production image → `prisma generate` for client → `CMD ["node", "main.js"]`. Uses Webpack-generated `package.json`.

3. **Dockerfile for Landing SSR** — Multi-stage build: `node:20-alpine` base → install pnpm deps → `nx build landing` → copy `dist/apps/landing/` to slim production image → `CMD ["node", "server/server.mjs"]`.

4. **Cloudflare Pages build config** — Configure build command: `pnpm nx build console --configuration=production`. Output directory: `dist/apps/console/browser`. Add `_redirects` file for SPA routing (`/* /index.html 200`).

5. **~~Supabase~~ Railway Postgres setup** — ~~Document provisioning steps.~~ Done. Railway Postgres provisioned as part of project. Internal networking via `postgres.railway.internal:5432`. No pooler/SSL needed.

6. **Railway project setup** — ~~Create project with two services (`api`, `landing`).~~ Done. Project `distinguished-dream` with API + Postgres services. API deployed and healthy. Landing SSR service deferred.

### Phase 2: CI/CD Pipeline

7. **Extend CI with deploy step** — Add deploy job to `.github/workflows/ci.yml`. Triggers only on `master` push (not PRs). Depends on `ci` and `e2e` jobs passing. Uses Railway GitHub integration or CLI for deployment.

8. **Production migration in deploy** — API startup command: `prisma migrate deploy && node main.js`. Runs pending migrations before app starts. Fails deployment if migration fails (Railway auto-rollback).

9. **Post-deploy smoke test** — GitHub Actions job hitting `GET /api/health` after deploy. Retry with backoff (Railway cold start). Fails workflow if unhealthy.

10. **Cloudflare Pages CI integration** — Connect CF Pages to GitHub repo. Configure build settings: root directory, build command, output directory. Automatic deploys on `master` push.

### Phase 3: Production Configuration

11. **Angular SSR API URL** — Landing SSR server reads `API_URL` env var at runtime. Passes to Angular app via transfer state or injects into `index.html` at serve time. No build-time URL hardcoding.

12. **Console environment configuration** — Update `environment.ts` (production) with configurable API URL. Since Console is a static SPA, the API URL is build-time. CF Pages build env vars inject the correct `apiBaseUrl`.

13. **Update `.env.example`** — Add `CORS_ORIGINS`, `PORT`, `API_URL` with documentation comments. Add Railway Postgres URL format example. Mark which vars are needed per service (API vs Landing vs Console).

14. **Admin seed in production** — Run `prisma db seed` via Railway CLI or one-time command after first deploy. Document the process. Verify idempotent behavior.

15. ~~**Supabase keep-alive**~~ — Removed. Railway Postgres doesn't pause after inactivity.

### Phase 4: Domain & SSL

16. **Configure custom domains** — Railway: add `example.com` to landing service, `api.example.com` to API service. Cloudflare Pages: add `console.example.com`. Configure DNS CNAME records. SSL auto-provisioned by both platforms.

17. **Update production env vars** — After domains configured: `CORS_ORIGINS=https://example.com,https://console.example.com`, `FRONTEND_URL=https://console.example.com`, `GOOGLE_CALLBACK_URL=https://api.example.com/api/auth/google/callback`. Update Google Cloud Console OAuth redirect URIs.

### Phase 5: Validation & Documentation

18. **Production validation checklist** — Execute manually: admin login → create invited user → verify invite email → set password → login as user → Google OAuth → refresh token rotation → logout → rate limiting active → CORS blocks unauthorized origins.

19. **Production runbook** — Document in `.context/runbook-production.md`: deploy process, rollback via git revert, run migrations manually, seed DB, check Railway logs, restart services, rotate secrets (`openssl rand -base64 32`), Supabase dashboard access, Cloudflare Pages dashboard.

## Technical Considerations

### Dockerfile Strategy (API)

See `apps/api/Dockerfile` for actual implementation. Key points:
- Multi-stage: builder (pnpm + nx build) → production (node:20-alpine)
- Prisma 7 uses `prisma.config.ts` (not `--schema` or `--url` flags)
- Pin `prisma@7.4.0` in production stage to avoid version mismatch
- `CMD` runs `prisma migrate deploy --config=./prisma/prisma.config.ts && node main.js`
- App binds to `0.0.0.0` (required for Railway proxy)

### Console SPA on Cloudflare Pages

- Build command: `pnpm nx build console --configuration=production`
- Build output: `dist/apps/console/browser`
- SPA routing: `_redirects` → `/* /index.html 200`
- Environment: `apiBaseUrl` baked at build time via Angular `environment.ts`
- CF Pages environment variables can be used with a build-time injection script if needed

### Railway Hobby Plan ($5/mo)

- **$5/month subscription** — covers API service + PostgreSQL
- **No sleep/cold starts** — hobby plan services stay running
- **Up to 4 vCPU, 4GB RAM** — configured per service
- **No persistent disk** — logs ephemeral (use Railway log viewer)
- **Region:** asia-southeast1-eqsg3a

### Cloudflare Pages Free Tier

- **500 builds/month** — more than enough for CI/CD
- **Unlimited bandwidth** — no traffic concerns
- **Global CDN** — fast worldwide
- **No cold starts** — static files served instantly

### Railway PostgreSQL (Hobby Plan)

- **Included in $5/mo hobby plan** — no separate DB cost
- **No pause/sleep** — always available, no keep-alive cron needed
- **Internal networking** — `postgres.railway.internal:5432`, no SSL overhead
- **Direct connections** — no PgBouncer needed for this scale

### Migration Safety

- `prisma migrate deploy` only runs pending migrations — never generates new ones
- If migration fails, Railway deploy fails and rolls back to previous image
- Destructive migrations require expand-migrate-contract pattern

### Rollback Process

1. Identify the bad commit on `master`
2. `git revert <commit>` → push to `master`
3. CI runs → deploys reverted code automatically (Railway + CF Pages)
4. If migration involved: assess if compensating migration needed

## Risks & Warnings

**Railway Sleep / Cold Starts**
- Free tier services sleep after inactivity. First visitor gets 5-10s wait.
- Mitigation: keep-alive cron OR accept for MVP. Upgrade to paid when portfolio goes public.

**~~Supabase Pause~~** — No longer applicable. Railway Postgres doesn't pause.

**Monorepo Build on CF Pages**
- CF Pages needs to build only the Console app, not the full monorepo.
- Mitigation: configure specific build command targeting `console` project.

**Secret Management**
- Secrets stored as platform environment variables (encrypted at rest on both Railway and CF Pages).
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be strong random values (`openssl rand -base64 32`).
- Mitigation: documented in runbook.

**Console API URL is Build-Time**
- Unlike SSR, the Console SPA bakes `apiBaseUrl` at build time.
- Changing API URL requires rebuild+redeploy of Console.
- Mitigation: acceptable for this architecture; URL changes are rare.

**Google OAuth Redirect**
- Must register production callback URL in Google Cloud Console before OAuth works.
- Mitigation: explicit task for this configuration.

## Success Criteria

- [ ] API accessible at `api.example.com/api/health`, returns 200
- [ ] Landing SSR accessible at `example.com`, renders server-side
- [ ] Console SPA accessible at `console.example.com`, loads and connects to API
- [ ] Admin can log in with seeded credentials on Console
- [ ] Full auth flow works: login → refresh → logout (on Console)
- [ ] Google OAuth login works with production callback
- [ ] Invite flow works: admin creates user → email sent → user sets password → login
- [ ] Database migrations run automatically on deploy
- [ ] CI/CD pipeline: push to master → tests pass → deploy all 3 apps → smoke test
- [ ] Custom domains with SSL configured for all 3 subdomains
- [ ] Rate limiting active in production (`NODE_ENV=production`)
- [ ] Rollback tested: git revert → previous version auto-deploys
- [x] ~~Supabase keep-alive~~ N/A — Railway Postgres doesn't pause

## Estimated Complexity

**L (Large)**

**Reasoning:** ~19 requirements across 5 phases. Three separate deployment targets (Railway x2, CF Pages), external service configuration (Supabase, Google OAuth, DNS), Dockerfiles, CI/CD extension, and production validation. Each task is small-medium individually, but the breadth of infrastructure and cross-platform coordination makes this a large effort.

## Status
done

## Created
2026-03-04
