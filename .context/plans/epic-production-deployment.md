# Epic: Production Deployment (MVP)

## Summary

Deploy the full portfolio application to production using free-tier infrastructure: Railway (API + Angular SSR Landing), Cloudflare Pages (Console SPA), Supabase (PostgreSQL). Establish CI/CD pipeline from GitHub Actions, configure custom domain with subdomains, and validate the full MVP auth flow in a real environment.

## Why

The User module hardening (Epic 124-132) establishes a secure auth foundation. Deploying now validates the entire pipeline end-to-end — database migrations, admin seeding, JWT auth, Google OAuth, email flows — in a real environment before building content modules. Early deployment de-risks infrastructure and enables incremental feature delivery.

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| API hosting | Railway (free tier, $5/mo credit) | Simple container deploys, native Node.js, easy env vars, fast wake from sleep |
| Landing SSR hosting | Railway (same platform) | Angular SSR requires Node.js runtime; CF Workers incompatible with Express-based SSR |
| Console SPA hosting | Cloudflare Pages (free tier) | Static SPA — perfect fit for CDN. No cold starts, global edge, unlimited bandwidth |
| Database | Supabase PostgreSQL (free tier) | Already chosen in DB architecture epic; generous free tier |
| Budget | $0 (free tiers only) | MVP validation phase; upgrade when traffic justifies |
| Deploy scope | MVP Auth only (User + Auth modules) | Validates infra pipeline; content modules deploy incrementally |
| Domain layout | `example.com` (landing), `console.example.com` (console), `api.example.com` (API) | Standard subdomain pattern; actual domain configured via env vars |
| Rollback strategy | Git-based revert | Revert commit on master → CI/CD auto-deploys previous version |

## Target Architecture

```
[Custom Domain]
  ├── example.com            → Railway    (Angular SSR, Node.js)
  ├── console.example.com    → Cloudflare Pages (Angular SPA, static)
  └── api.example.com        → Railway    (NestJS API, Node.js)
                                  └── Supabase PostgreSQL (free tier, pooled via PgBouncer)
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
- Supabase production database provisioning + pooled connection string
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
- Supabase free-tier keep-alive (scheduled ping)

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
- Database backups automation (Supabase free tier has daily backups)
- Load testing
- CDN for API responses

## High-Level Requirements

### Phase 1: Infrastructure Setup

1. **Health check endpoint** — `GET /api/health` on API. Returns `{ status: 'ok', db: 'connected' | 'error', timestamp }`. Performs `SELECT 1` via Prisma. No auth required. Used by Railway for service health and post-deploy smoke tests.

2. **Dockerfile for API** — Multi-stage build: `node:20-alpine` base → install pnpm deps → `nx build api` → copy `dist/apps/api/` to slim production image → `prisma generate` for client → `CMD ["node", "main.js"]`. Uses Webpack-generated `package.json`.

3. **Dockerfile for Landing SSR** — Multi-stage build: `node:20-alpine` base → install pnpm deps → `nx build landing` → copy `dist/apps/landing/` to slim production image → `CMD ["node", "server/server.mjs"]`.

4. **Cloudflare Pages build config** — Configure build command: `pnpm nx build console --configuration=production`. Output directory: `dist/apps/console/browser`. Add `_redirects` file for SPA routing (`/* /index.html 200`).

5. **Supabase production setup** — Document provisioning steps. Obtain pooled connection string (port 6543 for PgBouncer). Test connectivity from Railway.

6. **Railway project setup** — Create project with two services (`api`, `landing`). Each uses its Dockerfile. Configure all environment variables. Set health check path for API service.

### Phase 2: CI/CD Pipeline

7. **Extend CI with deploy step** — Add deploy job to `.github/workflows/ci.yml`. Triggers only on `master` push (not PRs). Depends on `ci` and `e2e` jobs passing. Uses Railway GitHub integration or CLI for deployment.

8. **Production migration in deploy** — API startup command: `prisma migrate deploy && node main.js`. Runs pending migrations before app starts. Fails deployment if migration fails (Railway auto-rollback).

9. **Post-deploy smoke test** — GitHub Actions job hitting `GET /api/health` after deploy. Retry with backoff (Railway cold start). Fails workflow if unhealthy.

10. **Cloudflare Pages CI integration** — Connect CF Pages to GitHub repo. Configure build settings: root directory, build command, output directory. Automatic deploys on `master` push.

### Phase 3: Production Configuration

11. **Angular SSR API URL** — Landing SSR server reads `API_URL` env var at runtime. Passes to Angular app via transfer state or injects into `index.html` at serve time. No build-time URL hardcoding.

12. **Console environment configuration** — Update `environment.ts` (production) with configurable API URL. Since Console is a static SPA, the API URL is build-time. CF Pages build env vars inject the correct `apiBaseUrl`.

13. **Update `.env.example`** — Add `CORS_ORIGINS`, `PORT`, `API_URL` with documentation comments. Add Supabase pooled URL format example. Mark which vars are needed per service (API vs Landing vs Console).

14. **Admin seed in production** — Run `prisma db seed` via Railway CLI or one-time command after first deploy. Document the process. Verify idempotent behavior.

15. **Supabase keep-alive** — GitHub Actions cron workflow (daily) that calls `GET https://api.example.com/health`. Keeps Supabase from pausing after 1 week inactivity.

### Phase 4: Domain & SSL

16. **Configure custom domains** — Railway: add `example.com` to landing service, `api.example.com` to API service. Cloudflare Pages: add `console.example.com`. Configure DNS CNAME records. SSL auto-provisioned by both platforms.

17. **Update production env vars** — After domains configured: `CORS_ORIGINS=https://example.com,https://console.example.com`, `FRONTEND_URL=https://console.example.com`, `GOOGLE_CALLBACK_URL=https://api.example.com/api/auth/google/callback`. Update Google Cloud Console OAuth redirect URIs.

### Phase 5: Validation & Documentation

18. **Production validation checklist** — Execute manually: admin login → create invited user → verify invite email → set password → login as user → Google OAuth → refresh token rotation → logout → rate limiting active → CORS blocks unauthorized origins.

19. **Production runbook** — Document in `.context/runbook-production.md`: deploy process, rollback via git revert, run migrations manually, seed DB, check Railway logs, restart services, rotate secrets (`openssl rand -base64 32`), Supabase dashboard access, Cloudflare Pages dashboard.

## Technical Considerations

### Dockerfile Strategy (API)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm nx build api --configuration=production
RUN pnpm prisma generate --schema=apps/api/prisma/schema.prisma

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api .
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
RUN npm install --omit=dev
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js"]
```

### Console SPA on Cloudflare Pages

- Build command: `pnpm nx build console --configuration=production`
- Build output: `dist/apps/console/browser`
- SPA routing: `_redirects` → `/* /index.html 200`
- Environment: `apiBaseUrl` baked at build time via Angular `environment.ts`
- CF Pages environment variables can be used with a build-time injection script if needed

### Railway Free Tier Constraints

- **$5/month credit** — sufficient for two small Node.js services (~$2.50 each)
- **Services sleep after ~15min inactivity** — acceptable for MVP; first request has ~5-10s cold start
- **500MB RAM, 1 vCPU per service** — sufficient for NestJS + Angular SSR
- **No persistent disk** — logs ephemeral (use Railway log viewer)

### Cloudflare Pages Free Tier

- **500 builds/month** — more than enough for CI/CD
- **Unlimited bandwidth** — no traffic concerns
- **Global CDN** — fast worldwide
- **No cold starts** — static files served instantly

### Supabase Free Tier Constraints

- **500MB storage** — more than enough for User table
- **Pauses after 1 week inactivity** — mitigated by keep-alive cron
- **Pooled connections via PgBouncer** (port 6543) — must use pooled URL
- **Daily backups included**

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

**Supabase Pause**
- Free tier pauses DB after 1 week of zero connections.
- Mitigation: scheduled health check ping prevents this.

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
- [ ] Supabase keep-alive cron running, DB doesn't pause

## Estimated Complexity

**L (Large)**

**Reasoning:** ~19 requirements across 5 phases. Three separate deployment targets (Railway x2, CF Pages), external service configuration (Supabase, Google OAuth, DNS), Dockerfiles, CI/CD extension, and production validation. Each task is small-medium individually, but the breadth of infrastructure and cross-platform coordination makes this a large effort.

## Status
proposed

## Created
2026-03-04
