# Task: Cloudflare Pages Console Setup

## Status: in-progress

## Goal
Configure Cloudflare Pages to build and deploy the Console SPA with correct build settings, SPA routing, and production environment configuration.

## Context
Phase 1 of epic-production-deployment. The Console is a static Angular SPA — perfect for Cloudflare Pages CDN. Unlike SSR, the API URL is baked at build time via Angular's `environment.ts`.

## Acceptance Criteria
- [ ] Cloudflare Pages project configured with build command: `pnpm nx build console --configuration=production`
- [ ] Build output directory set to `dist/apps/console/browser`
- [x] `_redirects` file created at `apps/console/src/_redirects` with `/* /index.html 200` and copied to build output via assets config
- [ ] Production `environment.ts` updated with configurable `apiBaseUrl` (uses CF Pages build env var or hardcoded production URL)
- [x] Console builds successfully with production configuration
- [x] SPA routes work correctly (`_redirects` confirmed in `dist/apps/console/browser/`)
- [ ] CF Pages connected to GitHub repo for automatic deploys on `master` push
- [ ] Build environment variables documented

## Technical Notes
- CF Pages build env vars can inject values — check if Angular's `fileReplacements` or a build-time script is needed
- `_redirects` file must be in the build output root (`dist/apps/console/browser/_redirects`)
- Consider placing `_redirects` in `apps/console/src/` and configuring Angular to copy it to output via `assets` in `project.json`
- CF Pages free tier: 500 builds/month, unlimited bandwidth
- Root directory in CF Pages config should point to monorepo root

## Files to Touch
- `apps/console/src/environments/environment.ts` (update production API URL)
- `apps/console/src/_redirects` (new)
- `apps/console/project.json` (add `_redirects` to assets)

## Dependencies
None — can be done in parallel with Dockerfiles.

## Complexity: S

## Progress Log
