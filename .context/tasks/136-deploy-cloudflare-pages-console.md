# Task: Cloudflare Pages Console Setup

## Status: pending

## Goal
Configure Cloudflare Pages to build and deploy the Console SPA with correct build settings, SPA routing, and production environment configuration.

## Context
Phase 1 of epic-production-deployment. The Console is a static Angular SPA — perfect for Cloudflare Pages CDN. Unlike SSR, the API URL is baked at build time via Angular's `environment.ts`.

## Acceptance Criteria
- [ ] Cloudflare Pages project configured with build command: `pnpm nx build console --configuration=production`
- [ ] Build output directory set to `dist/apps/console/browser`
- [ ] `public/_redirects` file created with `/* /index.html 200` for SPA routing
- [ ] Production `environment.ts` updated with configurable `apiBaseUrl` (uses CF Pages build env var or hardcoded production URL)
- [ ] Console builds successfully with production configuration
- [ ] SPA routes work correctly (deep links don't 404)
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
