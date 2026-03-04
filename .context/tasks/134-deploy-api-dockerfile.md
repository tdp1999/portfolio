# Task: API Dockerfile

## Status: done

## Goal

Create a multi-stage Dockerfile for the NestJS API that produces a slim production image with Prisma client, migrations, and the compiled application.

## Context

Phase 1 of epic-production-deployment. Railway deploys the API from this Dockerfile. The image must include Prisma client for runtime and migration files for `prisma migrate deploy` at startup.

## Acceptance Criteria

- [x] `apps/api/Dockerfile` created with multi-stage build
- [x] Stage 1 (builder): `node:20-alpine`, installs pnpm, copies monorepo, runs `nx build api --configuration=production`, generates Prisma client
- [x] Stage 2 (production): `node:20-alpine`, copies only `dist/apps/api/`, Prisma schema + migrations, generated Prisma client
- [x] `CMD` runs `prisma migrate deploy` before starting the app (`sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js"`)
- [x] `.dockerignore` created/updated to exclude `node_modules`, `.git`, `dist`, test files, IDE configs
- [x] Image builds successfully: `docker build -f apps/api/Dockerfile -t portfolio-api .`
- [x] Container starts and responds to `/api/health` (with database connection)
- [x] Image size is under 300MB
- [x] `EXPOSE 3000` included

## Technical Notes

- Build from monorepo root context (Dockerfile references root-level files)
- Nx Webpack build outputs `dist/apps/api/` with its own `package.json` — install production deps from that
- Prisma client is generated into `node_modules/.prisma` and `node_modules/@prisma` — copy both
- Copy `apps/api/prisma/` directory (schema + migrations) for `migrate deploy`
- Use `corepack enable` for pnpm in builder stage
- See epic plan for Dockerfile skeleton

## Files to Touch

- `apps/api/Dockerfile` (new)
- `.dockerignore` (new or update)

## Dependencies

- [133] Health Check Endpoint (to verify container works)

## Complexity: M

## Progress Log
