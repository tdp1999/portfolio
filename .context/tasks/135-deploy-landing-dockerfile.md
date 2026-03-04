# Task: Landing SSR Dockerfile

## Status: done

## Goal
Create a multi-stage Dockerfile for the Angular SSR Landing app that produces a slim production image serving server-side rendered pages.

## Context
Phase 1 of epic-production-deployment. Railway deploys the Landing SSR app from this Dockerfile. Angular SSR requires a Node.js runtime (Express-based server).

## Acceptance Criteria
- [x] `apps/landing/Dockerfile` created with multi-stage build
- [x] Stage 1 (builder): `node:20-alpine`, installs pnpm, copies monorepo, runs `nx build landing --configuration=production`
- [x] Stage 2 (production): `node:20-alpine`, copies `dist/apps/landing/` (server + browser bundles)
- [x] `CMD ["node", "server/server.mjs"]` starts the SSR server
- [x] Image builds successfully: `docker build -f apps/landing/Dockerfile -t portfolio-landing .`
- [x] Container starts and serves SSR-rendered HTML on the configured port
- [x] `API_URL` env var is read at runtime (not baked at build time)
- [x] Image size is under 300MB (198MB)
- [x] `EXPOSE 4000` included

## Technical Notes
- Angular SSR build outputs to `dist/apps/landing/` with `server/server.mjs` and `browser/` directory
- The SSR server is Express-based — check `server.ts` for actual entry point path
- Runtime API URL injection: SSR server should read `API_URL` from `process.env` and pass to Angular via transfer state or inject into rendered HTML
- Shares `.dockerignore` with API Dockerfile (already created in task 134)

## Files to Touch
- `apps/landing/Dockerfile` (new)

## Dependencies
- [134] API Dockerfile (shares `.dockerignore`, same build pattern)

## Complexity: S

## Progress Log
