# Task: Custom Domains & SSL

## Status: done

## Goal
Configure custom domain with subdomains across Railway and Cloudflare Pages, set up DNS records, and update all production environment variables to use the final domain.

## Context
Phase 4 of epic-production-deployment. API uses Railway's auto-generated domain. Landing and Console use custom domains on Cloudflare Pages.

## Acceptance Criteria

### DNS & Domain Configuration
- [x] `thunderphong.com` (landing) pointed to Cloudflare Pages
- [x] `console.thunderphong.com` (console) pointed to Cloudflare Pages
- [x] API accessible at `dashboard-api-production-d76d.up.railway.app` (Railway default domain)
- [x] SSL/TLS auto-provisioned on all domains (verified HTTPS works)

### Production Environment Updates
- [x] `CORS_ORIGINS` set: `https://console.thunderphong.com,https://thunderphong.com`
- [x] `FRONTEND_URL` set: `https://console.thunderphong.com`
- [x] `GOOGLE_CALLBACK_URL` set: `https://dashboard-api-production-d76d.up.railway.app/api/auth/google/callback`
- [x] Console SPA built with production `apiBaseUrl`: `https://dashboard-api-production-d76d.up.railway.app`

### Verification
- [x] `https://thunderphong.com` loads Landing
- [x] `https://console.thunderphong.com` loads Console SPA
- [x] `https://dashboard-api-production-d76d.up.railway.app/api/health` returns 200
- [x] CORS configured for authorized origins

### Not Applicable (revised)
- ~~`api.thunderphong.com` custom domain~~ — using Railway default URL
- ~~Landing SSR `API_URL` env var~~ — Landing is static on CF Pages

## Complexity: M

## Progress Log
- 2026-03-06: All verified live. Fixed GOOGLE_CALLBACK_URL (was missing https://). Revised ACs for actual architecture.
