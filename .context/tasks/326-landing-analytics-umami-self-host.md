# Task: Self-host Umami analytics on Railway

## Status: done

## Goal
Deploy Umami v2 (open-source, cookieless analytics) as a separate Railway service at `analytics.thunderphong.com`, backed by Railway Postgres. Embed the Umami tracking script on the landing site to start collecting privacy-respecting pageview data.

## Context
- Privacy policy (task 325) declares Umami as the analytics processor, self-hosted on Railway Singapore region, cookieless, IP-hashed-and-discarded. This task makes that declaration real.
- Umami is the chosen alternative to GA4 because: cookieless (no consent banner needed under GDPR/PDPL), first-party (data never leaves our infrastructure), open-source (auditable), proven on Railway (one-click template available).
- Stays inside the existing Railway + Cloudflare deployment pattern documented in `.context/guides/deploy-railway-ssr.md` — reuse same Cloudflare DNS / SSL / cache rules where applicable.
- Subdomain `analytics.thunderphong.com` is internal-facing (only owner uses the dashboard) but the tracking endpoint (`/api/send`) is hit by every public visitor. Both must work.

## Acceptance Criteria
- [x] Railway project "Portfolio" contains a new service "umami" running the official `ghcr.io/umami-software/umami:3.2.0` image (v3 dropped the `postgresql-` tag prefix — PostgreSQL-only now; pin the version, not `latest`). Boots clean: `umami@3.2.0 start-server` → Next.js 16.2.6 → Ready, listening on `0.0.0.0:8080`
- [x] Railway Postgres plugin attached to the umami service, `DATABASE_URL` wired via reference variable (`${{Postgres.DATABASE_URL}}`) — `check-db` passes
- [x] ~~`HASH_SALT`~~ **N/A in v3** — Umami v3 removed `HASH_SALT` (and `DATABASE_TYPE`); `APP_SECRET` is the sole secret
- [x] `APP_SECRET` set (random via `openssl rand -hex 32`, stored in Railway + password manager, never committed). `HOSTNAME` unneeded — server already binds `0.0.0.0`
- [x] Default admin credentials changed on first login; new strong password stored in password manager (not in repo)
- [x] DNS: `analytics.thunderphong.com` → Railway domain via CNAME on Cloudflare (proxied; Railway confirms "Cloudflare proxy detected"; resolves to CF IPs `104.21.x`/`172.67.x`)
- [x] Cloudflare SSL mode "Full (strict)" (confirmed in dashboard) + Cache Rule `umami-api-bypass` (analytics.thunderphong.com + path `/api/` → Bypass cache, Active). Verified: `/api/*` = not cached, `script.js` 200, HTTPS 200 clean
- [x] HTTPS works end-to-end: `https://analytics.thunderphong.com` serves Umami (`<title>Umami</title>`, `/api/heartbeat` 200, `/script.js` 200) with valid cert, via Singapore edge (cf-ray SIN)
- [x] Logged in, created a "website" entry for `thunderphong.com` → `data-website-id` = `d26e36be-b1c7-4be2-9bf7-0a9d5e394921`. Pipeline smoke-tested: synthetic POST to `/api/send` via the custom domain returned 200 + sessionId/visitId (proves ingestion + CF `/api/*` bypass + DB write)
- [x] Tracking script added to `apps/landing/src/index.html` before `</head>` — `async defer`, `src="https://analytics.thunderphong.com/script.js"` (custom domain, not the raw `*.up.railway.app`), `data-website-id` set
- [x] Verified a **real** visit to thunderphong.com is collected. Landing redeployed (~60s after push); production HTML serves the tracker. Loaded https://thunderphong.com/ in a real Chromium (playwright): script.js 200, DOM tag present with correct id (async+defer), **2× POST `/api/send` → 200**, zero console/CORS errors
- [x] Document the deployment in `.context/guides/deploy-umami-railway.md` (same shape as `deploy-railway-ssr.md`): Railway service config, Cloudflare DNS/SSL/cache rules, env vars, common failures, how to upgrade Umami version — written as a step-by-step runbook + "This deploy" worked example; serves as the manual checklist
- [x] No tracking script added until the Umami instance was verified live — order respected: Umami confirmed serving over HTTPS (heartbeat/script.js/login all 200) BEFORE the `index.html` embed

## Technical Notes
- **Cost expectation**: Railway Hobby plan covers this easily for portfolio traffic — ~$5/mo for Umami service + ~$5/mo for Postgres (or less on usage-based). Confirm before deploying if budget-sensitive.
- **Umami version**: v3.2.0 is latest stable (released 2026-06-24). v3 is PostgreSQL-only, so the image is `ghcr.io/umami-software/umami:3.2.0` (no `postgresql-` prefix). Pin the version rather than `latest` so an upstream breaking change does not silently take the dashboard down. Confirmed against the official `docker-compose.yml` at tag v3.2.0: only `DATABASE_URL` + `APP_SECRET` required; healthcheck path `/api/heartbeat`.
- **Backup**: Railway Postgres has automated backups on paid tier. For Hobby, optionally script a weekly `pg_dump` to Cloudflare R2 — but defer until there's data worth backing up.
- **CORS**: Umami requires the tracking script's origin (`analytics.thunderphong.com`) and the tracked site (`thunderphong.com`) to align; default config handles this but verify after deploy.
- **Privacy policy reference**: §3.2 and §4 of `privacy-policy.{en,vi}.md` already describe this setup correctly — no policy edits needed when this task ships.
- **Performance**: Umami's `script.js` is ~2KB gzipped. Loading it `async defer` keeps it off the critical path. Verify Lighthouse score does not regress after embed.

## Files to Touch
- Railway dashboard (manual configuration — no repo file)
- Cloudflare DNS dashboard (manual)
- `apps/landing/src/index.html` (add tracking script tag — last)
- `.context/guides/deploy-umami-railway.md` (new)

## Dependencies
- None hard. Task 325 (legal pages) is logically related but can ship independently — privacy policy already declares Umami regardless of whether Umami is live yet.

## Complexity: M

## Progress Log
- [2026-07-02] Started. Confirmed no hard dependency blocks. User will perform Railway/Cloudflare steps by hand; Claude writes the runbook + does repo-side work last.
- [2026-07-02] Wrote `.context/guides/deploy-umami-railway.md` — full step-by-step runbook (Railway image+Postgres+env, admin hardening, Cloudflare DNS/SSL-strict/cache-bypass for /api/*, website-id, tracking-script embed as LAST step, upgrade path, troubleshooting) + "This deploy" table with concrete thunderphong values. Remaining ACs are manual infra steps for the user; the `index.html` script embed is intentionally deferred until Umami is verified live.
- [2026-07-02] Done — all ACs satisfied. Pushed 324+326 as scoped commits (a613118, 098b0d6); landing auto-redeployed on Railway (~60s); real-browser (playwright) load of thunderphong.com fired 2× POST /api/send → 200, no CORS/console errors. Umami collection confirmed end-to-end.
- [2026-07-02] Deployed Umami v3.2.0 to Railway "Portfolio" project via web UI (image 3.2.0 → Postgres reference var → APP_SECRET → temp domain → admin password hardened). Custom domain `analytics.thunderphong.com` already resolved (CF proxied) and served Umami; SSL Full(strict) + `umami-api-bypass` cache rule confirmed. Created website entry (id d26e36be-…); smoke-tested `/api/send` (200 + session/visit). Embedded tracker in `apps/landing/src/index.html` (async defer, custom-domain src). Only remaining AC: verify a real pageview after landing redeploy.
- [2026-07-02] User targeting Umami v3.2.0 (latest). Verified against official docker-compose @ tag v3.2.0: image is `ghcr.io/umami-software/umami:3.2.0` (no `postgresql-` prefix — v3 is Postgres-only); `HASH_SALT` + `DATABASE_TYPE` removed, `APP_SECRET` is sole secret; add `HOSTNAME=0.0.0.0` for Railway; healthcheck `/api/heartbeat`. Updated guide + ACs accordingly. Decided to co-locate umami in the existing "Portfolio" Railway project. Guiding deploy via web dashboard (user learning the UI).
