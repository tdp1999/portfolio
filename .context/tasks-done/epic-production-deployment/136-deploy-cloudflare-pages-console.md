# Task: Cloudflare Pages Console Setup

## Status: done

## Goal
Configure Cloudflare Pages to build and deploy the Console SPA with correct build settings, SPA routing, and production environment configuration.

## Context
Phase 1 of epic-production-deployment. The Console is a static Angular SPA — perfect for Cloudflare Pages CDN. Unlike SSR, the API URL is baked at build time via Angular's `environment.ts`.

## Acceptance Criteria
- [x] Cloudflare Pages project configured with build command: `pnpm nx build console --configuration=production`
- [x] Build output directory set to `dist/apps/console/browser`
- [x] `_redirects` file created at `apps/console/src/_redirects` with `/* /index.html 200` and copied to build output via assets config
- [x] Production `environment.ts` updated with hardcoded production API URL (`dashboard-api-production-d76d.up.railway.app`)
- [x] Console builds successfully with production configuration
- [x] SPA routes work correctly (`_redirects` confirmed in `dist/apps/console/browser/`)
- [x] CF Pages connected to GitHub repo for automatic deploys on `master` push
- [x] Custom domain `console.thunderphong.com` connected

## Complexity: S

## Progress Log
- 2026-03-06: All criteria verified — CF Pages live at console.thunderphong.com, auto-deploys on master push
