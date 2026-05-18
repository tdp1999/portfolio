# Task: Self-host Umami analytics on Railway

## Status: pending

## Goal
Deploy Umami v2 (open-source, cookieless analytics) as a separate Railway service at `analytics.thunderphong.com`, backed by Railway Postgres. Embed the Umami tracking script on the landing site to start collecting privacy-respecting pageview data.

## Context
- Privacy policy (task 325) declares Umami as the analytics processor, self-hosted on Railway Singapore region, cookieless, IP-hashed-and-discarded. This task makes that declaration real.
- Umami is the chosen alternative to GA4 because: cookieless (no consent banner needed under GDPR/PDPL), first-party (data never leaves our infrastructure), open-source (auditable), proven on Railway (one-click template available).
- Stays inside the existing Railway + Cloudflare deployment pattern documented in `.context/guides/deploy-railway-ssr.md` — reuse same Cloudflare DNS / SSL / cache rules where applicable.
- Subdomain `analytics.thunderphong.com` is internal-facing (only owner uses the dashboard) but the tracking endpoint (`/api/send`) is hit by every public visitor. Both must work.

## Acceptance Criteria
- [ ] Railway project contains a new service "umami" running the official `ghcr.io/umami-software/umami:postgresql-latest` image
- [ ] Railway Postgres plugin attached to the umami service, `DATABASE_URL` wired
- [ ] `HASH_SALT` environment variable set (random 32-char string, stored only in Railway, never committed)
- [ ] `APP_SECRET` set
- [ ] Default admin credentials changed on first login; new strong password stored in 1Password / password manager (not in repo)
- [ ] DNS: `analytics.thunderphong.com` → Railway's generated domain via CNAME on Cloudflare
- [ ] Cloudflare SSL mode "Full (strict)" for the subdomain; "Cache Rule" set to **bypass cache** for `/api/*` paths so tracking events aren't cached
- [ ] HTTPS works end-to-end: `https://analytics.thunderphong.com` shows Umami login page with valid cert
- [ ] Logged in, create a "website" entry for `thunderphong.com` and copy the tracking script
- [ ] Tracking script (`<script async defer src="https://analytics.thunderphong.com/script.js" data-website-id="..."></script>`) added to `apps/landing/src/index.html` — placed before `</head>` per Umami recommendation
- [ ] Verify in Umami dashboard that a visit to thunderphong.com appears within 30 seconds
- [ ] Document the deployment in `.context/guides/deploy-umami-railway.md` (same shape as `deploy-railway-ssr.md`): Railway service config, Cloudflare DNS/SSL/cache rules, env vars, common failures, how to upgrade Umami version
- [ ] No tracking script added until the Umami instance is verified live (otherwise script 404s damage performance + Lighthouse)

## Technical Notes
- **Cost expectation**: Railway Hobby plan covers this easily for portfolio traffic — ~$5/mo for Umami service + ~$5/mo for Postgres (or less on usage-based). Confirm before deploying if budget-sensitive.
- **Umami version**: pin to a specific tag (e.g. `umami-software/umami:postgresql-v2.13.0`) rather than `latest`, so an upstream breaking change does not silently take the dashboard down.
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
