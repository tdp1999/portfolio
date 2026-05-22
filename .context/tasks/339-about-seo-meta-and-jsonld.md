# Task: `/about` SEO meta + JSON-LD Person + sitemap update + footer link audit

## Status: pending

## Goal
Wire SEO metadata for `/about`: title, description, og tags, JSON-LD Person schema (verify reuse from home), update sitemap, audit footer/nav links for `/about` discoverability.

## Context
Per epic, `/about` is the dedicated hiring-funnel surface — SEO matters. Home already injects JSON-LD Person via the meta service from `epic-portfolio-contact` F6 fix. Verify `/about` also injects it. Sitemap must drop `/experience` and add `/about`.

## Acceptance Criteria
- [ ] `<title>` set per locale: "About — Phương Trần" / "Về tôi — Phương Trần"
- [ ] Meta description = hero sub-paragraph (per locale)
- [ ] OG tags: `og:title`, `og:description`, `og:type=profile`, `og:image` (from `Profile.ogImage`), `og:url=/about`
- [ ] JSON-LD `Person` schema injected via existing `LandingMetaService` — verify schema includes `jobTitle`, `worksFor`, `sameAs` (social links), `image`, `address`
- [ ] Sitemap regenerated: `/about` added, `/experience` removed (verify 301 still in place to redirect old crawlers)
- [ ] Footer link audit: replace any existing `/experience` link with `/about`; add `/about` to wherever `/uses`, `/colophon`, `/contact` are linked
- [ ] llms.txt entry for `/about` added (if task 323 has shipped; otherwise note as follow-up)
- [ ] Type-check + landing prod build clean
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
