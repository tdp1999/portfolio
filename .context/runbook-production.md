# Production Runbook

## Architecture Overview

| Service     | Platform         | URL                                      |
| ----------- | ---------------- | ---------------------------------------- |
| API         | Railway          | `https://dashboard-api.thunderphong.com`  |
| Console SPA | Cloudflare Pages | `https://console.thunderphong.com`       |
| Landing     | Cloudflare Pages | `https://thunderphong.com`               |
| Postgres    | Railway          | Internal (`postgres.railway.internal`)   |

## Deployment

All deployments are automatic on `master` push:

- **API:** Railway GitHub integration detects push, builds Dockerfile, deploys
- **Console + Landing:** Cloudflare Pages GitHub integration detects push, runs build, deploys

### Deployment Order

1. Push to `master`
2. Railway + CF Pages build in parallel (auto-triggered)
3. API container runs `prisma migrate deploy` + `prisma db seed` on startup
4. GitHub Actions smoke test (`deploy.yml`) runs after 30s delay, hits health endpoints

### Smoke Test Workflow (`.github/workflows/deploy.yml`)

- Triggers on `master` push
- Waits 30s for Railway deploy propagation
- Hits `/api/health` (5 retries, 10s delay)
- Hits `/api/health/db` (3 retries, 5s delay)
- Requires `PRODUCTION_API_URL` GitHub secret

## Rollback

To rollback a bad deploy:

```bash
# 1. Revert the bad commit
git revert <commit-hash>

# 2. Push to master — triggers auto-redeploy
git push origin master
```

- Railway redeploy: ~2 minutes (Docker build + startup + migration check) — measured 2026-03-06
- CF Pages redeploy: ~1-2 minutes (build + CDN propagation)
- Total rollback time from revert push to API live: ~2 minutes

For immediate rollback without waiting for build, use Railway dashboard to redeploy a previous deployment.

## CI Pipeline (`.github/workflows/ci.yml`)

Runs on all pushes and PRs to `master`:

- Format check, lint, test, build (affected only)
- E2E tests with Playwright + Postgres service container

## Database

### Run Migrations Manually

```bash
railway run --service "Dashboard API" -- node_modules/.bin/prisma migrate deploy --config=./prisma/prisma.config.ts
```

### Seed Database

Seed runs automatically on every deploy (Dockerfile CMD). It is idempotent — safe to run multiple times.

To run manually:

```bash
railway run --service "Dashboard API" -- node_modules/.bin/prisma db seed --config=./prisma/prisma.config.ts
```

Or use Railway dashboard shell.

## Viewing Logs

### Railway (API + Postgres)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select project "distinguished-dream"
3. Click "Dashboard API" service
4. **Deploy logs:** Click a deployment to see build + startup logs
5. **Runtime logs:** Click "Logs" tab for live application logs
6. Filter by time range or search for specific text

### Cloudflare Pages (Console + Landing)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
2. Select the project (console or landing)
3. **Build logs:** Click a deployment to see build output
4. **No runtime logs** — static hosting, errors are client-side only

### GitHub Actions (CI + Smoke Test)

1. Go to repo > Actions tab
2. Select workflow (CI or Post-Deploy Smoke Test)
3. Click a run to see step-by-step logs

## Restart Services

### API (Railway)

1. Railway Dashboard > "Dashboard API" service
2. Click "Deployments" tab
3. Click the three-dot menu on current deployment > "Redeploy"
4. Or push an empty commit: `git commit --allow-empty -m "chore: trigger redeploy" && git push`

### Console / Landing (Cloudflare Pages)

1. CF Dashboard > Pages > select project
2. Click "Deployments" > three-dot menu > "Retry deployment"
3. Or push a commit to trigger rebuild

## Rotate Secrets

1. Generate a new secret:

   ```bash
   openssl rand -base64 32
   ```

2. Update on Railway:

   ```bash
   railway variables --set "JWT_SECRET=<new-value>" --service "Dashboard API"
   ```

3. The variable change triggers an automatic redeploy.

4. Secrets to rotate periodically:
   - `JWT_SECRET` — invalidates all existing access tokens
   - `JWT_REFRESH_SECRET` — invalidates all refresh tokens (forces re-login)
   - `RESEND_API_KEY` — regenerate in Resend dashboard first
   - `GOOGLE_CLIENT_SECRET` — regenerate in Google Cloud Console first

**Warning:** Rotating `JWT_SECRET` or `JWT_REFRESH_SECRET` logs out all users immediately.

## Environment Variables

### API (Railway - Dashboard API service)

See `.env.example` for full list with descriptions.

Key production variables:

- `DATABASE_URL` — Railway Postgres internal URL (auto-injected by Railway)
- `CORS_ORIGINS` — `https://console.thunderphong.com,https://thunderphong.com`
- `FRONTEND_URL` — `https://console.thunderphong.com`
- `GOOGLE_CALLBACK_URL` — `https://dashboard-api.thunderphong.com/api/auth/google/callback`

### Console (Cloudflare Pages - build-time)

API URL is baked into the build via `apps/console/src/environments/environment.ts`.

### GitHub Secrets

- `PRODUCTION_API_URL` — Used by smoke test workflow

## Troubleshooting

### API not responding after deploy

1. Check Railway deploy logs for migration/seed errors
2. Verify health: `curl https://dashboard-api.thunderphong.com/api/health`
3. Check DB: `curl https://dashboard-api.thunderphong.com/api/health/db`
4. Check Railway dashboard for deploy status (failed builds, crashed containers)

### Console shows old version

CF Pages builds may take 1-2 minutes. Check Cloudflare Pages dashboard for build status.

### Database connection issues

1. Check `/api/health/db` endpoint
2. Verify Postgres service is running in Railway dashboard
3. `DATABASE_URL` uses internal network (`postgres.railway.internal`) — only accessible from Railway services

### OAuth not working

1. Verify `GOOGLE_CALLBACK_URL` includes `https://` prefix
2. Check Google Cloud Console > Credentials > OAuth redirect URIs match exactly
3. Check Railway logs for OAuth error details
