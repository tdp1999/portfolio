# Task: Railway Project Setup

## Status: pending

## Goal
Create and configure a Railway project with two services (API and Landing SSR), environment variables, and health checks.

## Context
Phase 1 of epic-production-deployment. Railway hosts both Node.js services (API + Landing SSR). Each service uses its own Dockerfile. This task is the platform configuration that ties together the Dockerfiles and Supabase database.

## Acceptance Criteria
- [ ] Railway project created with two services: `api` and `landing`
- [ ] Each service configured to use its respective Dockerfile (`apps/api/Dockerfile`, `apps/landing/Dockerfile`)
- [ ] All required environment variables configured on `api` service (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGINS, NODE_ENV, PORT, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, SMTP_* vars)
- [ ] Landing service environment variables configured (API_URL, PORT, NODE_ENV)
- [ ] Health check configured for API service (`/api/health`)
- [ ] Services connected to GitHub repo
- [ ] Both services deploy successfully from `master` branch
- [ ] API responds to `/api/health` with 200 on Railway URL
- [ ] Landing serves SSR HTML on Railway URL
- [ ] Railway setup steps documented in `.context/runbook-production.md`

## Technical Notes
- Railway free tier: $5/month credit, services sleep after ~15min inactivity
- Each service gets ~500MB RAM, 1 vCPU — sufficient for NestJS + Angular SSR
- Railway auto-provisions HTTPS on `*.railway.app` domains
- Set `PORT` env var — Railway injects its own, ensure app reads it
- Build context is monorepo root; Dockerfile path is relative to root
- Use Railway's GitHub integration for automatic deploys

## Files to Touch
- `.context/runbook-production.md` (Railway section)

## Dependencies
- [134] API Dockerfile
- [135] Landing SSR Dockerfile
- [137] Supabase Production Database (need connection string)

## Complexity: M

## Progress Log
