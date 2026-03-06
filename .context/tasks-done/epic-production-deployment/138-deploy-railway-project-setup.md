# Task: Railway Project Setup

## Status: done

## Goal
Create and configure a Railway project with services, environment variables, and health checks.

## Context
Phase 1 of epic-production-deployment. Railway hosts API + Postgres (hobby plan $5/mo). Originally planned two services (API + Landing SSR), but Landing SSR deployment deferred — currently only API service is deployed.

## What Was Done
- Railway project `distinguished-dream` created
- **Services:** Dashboard API + Postgres (2 services)
- API service configured with Dockerfile (`apps/api/Dockerfile`)
- Connected to GitHub repo `tdp1999/portfolio` for auto-deploys from `master`
- Region: `asia-southeast1-eqsg3a`
- Environment variables configured: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGINS, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, RESEND_API_KEY, EMAIL_FROM, PORT
- Public domain: `dashboard-api-production-d76d.up.railway.app`
- Private domain: `dashboard-api.railway.internal`
- API responds to `/api/health` with 200
- DB health check at `/api/health/db` returns connected

## Key Fixes During Setup
1. Prisma 7 `--url` flag incompatibility — switched to `--config` with `prisma.config.ts`
2. Prisma version mismatch in Docker — pinned `prisma@7.4.0` via npm install
3. NestJS binding to `localhost` — changed to `0.0.0.0` for Railway proxy access
4. PORT mismatch — set `PORT=3000` to match Dockerfile `EXPOSE 3000`

## Remaining
- [ ] Landing SSR service (deferred — not yet needed for MVP validation)
- [ ] Health check path configured in Railway service settings (currently no auto-health-check)

## Dependencies
- [134] API Dockerfile (done)

## Complexity: M

## Progress Log
- 2026-03-05: Railway project created, API deployed successfully, health checks passing.
