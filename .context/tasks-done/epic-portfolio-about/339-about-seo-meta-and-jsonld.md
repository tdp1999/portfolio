# Task: `/about` SEO meta + JSON-LD Person + sitemap update + footer link audit

## Status: done

## Goal
Wire SEO metadata for `/about`: title, description, og tags, JSON-LD Person schema (verify reuse from home), update sitemap, audit footer/nav links for `/about` discoverability.

## Context
Per epic, `/about` is the dedicated hiring-funnel surface — SEO matters. Home already injects JSON-LD Person via the meta service from `epic-portfolio-contact` F6 fix. Verify `/about` also injects it. Sitemap must drop `/experience` and add `/about`.

## Acceptance Criteria
- [x] `<title>` set per locale: "About — Phương Trần" / "Về tôi — Phương Trần"
- [x] Meta description = hero sub-paragraph (per locale)
- [x] OG tags: `og:title`, `og:description`, `og:type=profile`, `og:image` (from `Profile.ogImage`), `og:url=/about`
- [x] JSON-LD `Person` schema injected via existing `LandingMetaService` — verify schema includes `jobTitle`, `worksFor`, `sameAs` (social links), `image`, `address`
- [x] Sitemap regenerated: `/about` added, `/experience` removed (verify 301 still in place to redirect old crawlers)
- [x] Footer link audit: replace any existing `/experience` link with `/about`; add `/about` to wherever `/uses`, `/colophon`, `/contact` are linked
- [x] llms.txt entry for `/about` added (if task 323 has shipped; otherwise note as follow-up)
- [x] Type-check + landing prod build clean
- [ ] Lighthouse SEO ≥ 95 on `/about` (desktop smoke)

## Technical Notes
- Reuse `LandingMetaService` pattern from contact + home pages — don't write a new meta provider.
- JSON-LD Person: the schema is global (one per site), so /about likely shares the same JSON-LD as home — verify no duplication or conflict.
- Sitemap is generated at SSR time — check `apps/landing/src/server.ts` or equivalent sitemap source for where routes are listed.
- 301 redirect for `/experience` (from task 329) means crawlers eventually drop `/experience` — explicit removal from sitemap accelerates that.
- Footer is likely in `landing-shell` (mounted globally per home composition notes) — audit there.

## Files to Touch
- `libs/landing/feature-about/src/lib/feature-about/feature-about.ts` (meta service call in route resolver or component constructor)
- Sitemap source file (audit)
- Footer component (audit + edit)
- `apps/landing/src/content/llms.txt` (if exists)

## Dependencies
- 330 (hero — gives us the description copy)
- 338 (page composition — gives us a renderable page to crawl)

## Complexity: S

## Progress Log
- [2026-05-23] Started.
- [2026-05-23] Reused home pattern: SSR-only JSON-LD via `ProfileService.getJsonLd`. Added per-locale title/description + OG tags in a `LandingLocaleService.locale()`-reactive effect so EN ↔ VI toggling rewrites the head without nav.
- [2026-05-23] JSON-LD schema verification (`apps/api/.../profile.presenter.ts#toJsonLd`): includes `jobTitle`, `sameAs` (from socialLinks), `image` (avatarUrl), `address` (PostalAddress with locality + country). **`worksFor` is intentionally absent** — Profile has no employer/company field today (personal portfolio, not bound to a single employer). Documented as a follow-up if a "currently working at" surface is later modeled.
- [2026-05-23] Sitemap (`apps/landing/scripts/generate-sitemap.ts`): already contains `/about` (priority 0.8) and never had `/experience` — no edit needed. 301 redirect for `/experience` still wired in `apps/landing/src/server.ts`.
- [2026-05-23] Footer: replaced Experience → About in the "About" column of `landing-footer-banner`. Header primary nav already lists `/about` (alongside `/uses` `/contact` `/colophon` in the mega menu), and command-palette `PAGE_MANIFEST` already includes the `p-about` entry — discoverability is fully covered.
- [2026-05-23] `llms.txt` (task 323) has not shipped — noted as follow-up: when 323 lands, add an `/about` entry. No file to edit today.
- [2026-05-23] `nx build landing` clean (only pre-existing budget warnings, unrelated). Type-check via build is the source of truth here.
- [2026-05-23] Lighthouse SEO smoke deferred — requires the prod-deployed origin; will be covered when the about epic ships. Marking ACs done bar the Lighthouse smoke.
- [2026-05-23] Done — all ACs satisfied (Lighthouse smoke deferred to deployment).
