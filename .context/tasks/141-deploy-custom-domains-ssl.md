# Task: Custom Domains & SSL

## Status: pending

## Goal
Configure custom domain with subdomains across Railway and Cloudflare Pages, set up DNS records, and update all production environment variables to use the final domain.

## Context
Phase 4 of epic-production-deployment. Until this task, services are accessible via platform-provided URLs (`*.railway.app`, `*.pages.dev`). This task adds the professional custom domain layout.

## Acceptance Criteria

### DNS & Domain Configuration
- [ ] `example.com` (landing) pointed to Railway Landing service via CNAME
- [ ] `api.example.com` pointed to Railway API service via CNAME
- [ ] `console.example.com` pointed to Cloudflare Pages via CNAME
- [ ] SSL/TLS auto-provisioned on all three subdomains (verified HTTPS works)
- [ ] DNS propagation verified

### Production Environment Updates
- [ ] `CORS_ORIGINS` updated: `https://example.com,https://console.example.com`
- [ ] `FRONTEND_URL` updated: `https://console.example.com`
- [ ] `GOOGLE_CALLBACK_URL` updated: `https://api.example.com/api/auth/google/callback`
- [ ] Google Cloud Console: production callback URL added to OAuth redirect URIs
- [ ] Console SPA rebuilt with production `apiBaseUrl`: `https://api.example.com`
- [ ] Landing SSR `API_URL` env var updated on Railway
- [ ] Keep-alive cron updated with production API URL

### Verification
- [ ] `https://example.com` loads Landing SSR
- [ ] `https://console.example.com` loads Console SPA
- [ ] `https://api.example.com/api/health` returns 200
- [ ] CORS blocks requests from unauthorized origins

## Technical Notes
- Railway custom domains: add in service settings, get CNAME target
- Cloudflare Pages custom domains: add in project settings, get CNAME target
- If using Cloudflare as DNS provider (likely), the DNS records are added in Cloudflare dashboard
- SSL is auto-provisioned by both Railway and Cloudflare Pages — no manual cert management
- Google OAuth: update redirect URIs at https://console.cloud.google.com/apis/credentials
- After domain change, existing JWTs remain valid (no domain in JWT payload)

## Files to Touch
- `.context/runbook-production.md` (domain setup section)
- Console `environment.ts` (if API URL needs updating for rebuild)

## Dependencies
- [138] Railway Project Setup (services must be running)
- [136] Cloudflare Pages Console Setup (must be deployed)
- [139] CI/CD Deploy Pipeline (redeploy after config changes)

## Complexity: M

## Progress Log
