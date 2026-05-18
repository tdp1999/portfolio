# Task: Landing sitemap + robots.txt

## Status: done

## Goal
Generate `sitemap.xml` from the prerendered route list and ship a `robots.txt`. Final SEO polish (OG image, JSON-LD Person, etc.) happens in E6.

## Context
Search indexing needs both files. Keep this minimal — just enumerate the routes and set sane defaults.

## Acceptance Criteria
- [x] `sitemap.xml` generated at build time enumerating the full landing route set (home, /projects, /projects/:slug × N, /experience, /blog, /uses, /colophon)
- [x] `lastmod` populated from project markdown mtime (per-project), current build date for static / listing pages
- [x] `robots.txt` allows all crawlers including modern AI bots (GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended…), references the sitemap URL
- [x] Both files served at root paths (`/sitemap.xml`, `/robots.txt`) by the SSR server
- [x] Smoke check: served via local SSR dist returns 200 + valid XML (curl verified — see Progress Log)
- [x] Bonus: `.well-known/security.txt` (RFC 9116) shipped at root for security disclosure

## Technical Notes
- Build-time tsx script (`apps/landing/scripts/generate-sitemap.ts`) consumes the static route list + `apps/landing/content/projects/*.md` filesystem for per-project slugs and mtime.
- Wired via a `generate-sitemap` Nx target with `dependsOn: ["build"]`; root `pnpm build:landing` now invokes it (covers Dockerfile build via explicit `&&` chain).
- `robots.txt` content is static; `security.txt` content is static.
- Angular asset glob expanded with a dedicated entry for `.well-known/` so the dotfile path is copied into the browser dist.
- Projects route is `RenderMode.Server`, so prerender output cannot be the slug source — filesystem of `content/projects/` is canonical for now (matches the same content seeded into the API).

## Files Touched
- `apps/landing/scripts/generate-sitemap.ts` (new)
- `apps/landing/public/robots.txt` (new)
- `apps/landing/public/.well-known/security.txt` (new — bonus, scope confirmed with user)
- `apps/landing/project.json` (`generate-sitemap` target + `.well-known/` asset entry)
- `apps/landing/Dockerfile` (chained sitemap step into prod build)
- `package.json` (root `build:landing` now runs the `generate-sitemap` target)

## Follow-ups (NOT in this task)
- Task 323 — `llms.txt` (AI-era curated site index)
- Task 324 — PWA manifest + icon set (apple-touch-icon, icon-192, icon-512)
- OG image / JSON-LD Person — already scoped to E6

## Dependencies
- 300

## Complexity: S

## Progress Log
- [2026-05-17] Started. Pre-work drill with user on what static files a modern landing page needs (traditional SEO + AI-era). Confirmed scope: 302 + `.well-known/security.txt` bonus; explicit allow-list of AI bots in robots.txt; build-time sitemap script (not runtime SSR). Created follow-up tasks 310 (llms.txt) and 311 (PWA manifest).
- [2026-05-17] Wrote `generate-sitemap.ts` — enumerates 6 static routes + N project slugs from filesystem mtime. SITE_URL via env (defaults `https://thunderphong.com`). Output to `dist/apps/landing/browser/sitemap.xml`.
- [2026-05-17] Wrote `robots.txt` with explicit allow blocks for answer/search bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot, ChatGPT-User, Claude-User, Perplexity-User) and training bots (GPTBot, ClaudeBot, anthropic-ai, Google-Extended, Applebot-Extended, Meta-ExternalAgent, CCBot). Disallows `/api/`, `/ddl/`, `/404`. References sitemap.
- [2026-05-17] Wrote `.well-known/security.txt` per RFC 9116 (Contact, Expires 2027-05-17, Canonical, Preferred-Languages).
- [2026-05-17] Added `generate-sitemap` Nx target (`dependsOn: ["build"]`, runs `tsx apps/landing/scripts/generate-sitemap.ts`). Added explicit `.well-known/` asset entry so the dotfile path survives the Angular build glob.
- [2026-05-17] Updated `pnpm build:landing` → `nx generate-sitemap landing`. Dockerfile chains `nx build landing && tsx apps/landing/scripts/generate-sitemap.ts` to keep prod containers self-contained.
- [2026-05-17] Verified: `nx build landing --configuration=development` succeeded; ran SSR server from dist on port 4444; curl returned 200 for `/robots.txt` (3061 B), `/sitemap.xml` (1642 B, valid XML, 9 URLs), `/.well-known/security.txt` (162 B). Script type-checks clean under strict mode.
- [2026-05-17] Done — all ACs satisfied.
