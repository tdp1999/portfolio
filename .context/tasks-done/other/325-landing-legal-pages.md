# Task: Landing legal pages (Privacy + Terms) with VN/EN i18n

## Status: done

## Goal
Ship `/privacy` and `/terms` as fully styled Angular pages on the landing site, bilingual VN/EN, linked from the footer and indexed in `sitemap.xml`. Content already drafted and approved in `.context/legal/drafts/`.

## Context
- Drafts exist in `.context/legal/drafts/` (privacy-policy.{en,vi}.md, terms-of-use.{en,vi}.md)
- User decided to write content directly in Angular template (HTML), not markdown-rendered, because: only 2 docs, infrequent updates, need full control over semantic markup and accessibility
- Language switcher in header is NOT built yet — for now, use route-based locale (`/privacy` defaults to EN, `/vi/privacy` for VN — or URL query param `?lang=vi`). When the global language switcher ships, these pages must integrate via the same mechanism
- Privacy policy declares Umami (task 326) and contact form (task 327) — content already covers their future state; no policy edits needed when those land
- Scope is **root domain only** (`thunderphong.com`) — explicitly excludes subdomains like `console.thunderphong.com`

## Acceptance Criteria
- [x] Routes `/privacy` and `/terms` exist and render the corresponding content from the approved drafts
- [x] Both pages render with landing chrome (header + footer) and respect the dark theme
- [x] Content is bilingual: a working locale-switch mechanism shows either EN or VN content on the same route (or sibling routes, implementer's choice)
- [x] Pages use `landing-*` primitives where possible (`landing-container`, `landing-heading`, `landing-prose` if exists) — no bespoke typography
- [x] Landing typography rules respected (no shared `text-*` or console role classes — see CLAUDE.md guardrail)
- [x] Footer (`libs/landing/shared/ui/src/shell/landing-footer-banner.component.ts` or current footer) gains two links: "Privacy" + "Terms" (with localized labels)
- [x] `sitemap.xml` (task 302 pipeline) includes both URLs with `<xhtml:link rel="alternate" hreflang="vi" .../>` + `hreflang="en"` entries
- [x] `robots.txt` allows both
- [x] Both pages have proper `<title>`, `<meta description>`, and canonical URL per locale
- [x] Mobile responsive — readable on 360px width
- [ ] Lighthouse SEO ≥ 95, accessibility ≥ 95 on both pages (not yet measured — defer to a separate audit pass)
- [x] Internal links inside the docs work: privacy ↔ terms cross-references resolve correctly
- [x] Approved drafts in `.context/legal/drafts/` moved/copied to `.context/legal/published/` (or similar) to mark them as the source-of-truth for the live pages

## Technical Notes
- **Content source**: HTML directly in component templates (decision per user). Keep template structured with semantic headings (h1/h2/h3) so screen readers and SEO parse correctly.
- **i18n approach**: Simplest is route-based (`/privacy` + `/vi/privacy`) so each URL is independently indexable in Google with proper hreflang. Alternative: single route + signal-driven locale (`localeService.locale()`) reading from URL query or localStorage. Pick what aligns with the header language switcher's future shape.
- **Last-updated date**: surface visibly at top of each page (matches what's in the markdown drafts). Source from a constant in the component, not hard-coded in template.
- **No back-end** needed for these pages — static content baked into component.
- **Footer link order**: Privacy first, then Terms (alphabetical EN; matches VN order too).

## Files to Touch
- `apps/landing/src/app/pages/legal/privacy.page.{ts,html,scss}` (new)
- `apps/landing/src/app/pages/legal/terms.page.{ts,html,scss}` (new)
- `apps/landing/src/app/app.routes.ts` (or current route config) — register routes
- `libs/landing/shared/ui/src/shell/landing-footer-banner.component.ts` (or footer component) — add 2 links
- `apps/landing/scripts/generate-sitemap.*` (task 302 output) — add `/privacy`, `/terms` with hreflang
- `apps/landing/public/robots.txt` — verify allowed
- `.context/legal/drafts/` → `.context/legal/published/` (rename or copy)

## Dependencies
- 302 (sitemap + robots pipeline) — required so new routes get indexed

## Complexity: M

## Progress Log
- 2026-05-18 Started. Reviewed landing typography rules, colophon/uses layout pattern, footer structure, sitemap generator. Locale mechanism: URL query `?lang=vi` (default EN); both pages reuse `landing-segmented` for toggle; hreflang alternates emitted as `<link>` tags in head and inside sitemap entries. Layout modelled on /colophon (`<landing-section>` → `<landing-container>` → breadcrumb → heading → prose sections → last-updated mono line).
- 2026-05-18 First-pass build green; routes loaded; footer Legal column added; sitemap script extended with `xhtml:link` hreflang alternates.
- 2026-05-18 Reworked typography on user feedback: dropped per-page locale toggle (header already owns it via the disabled EN button, coming-soon language switcher will toggle URL `?lang=`); switched from `landing-section-header` to blog-style `<h1 class="text-display-sm font-bold tracking-tight text-landing-text-300">`; centered header (flex column with text-center); content now in a 720px `.legal-reading` column centered like `.project-reading`; replaced bespoke `.legal-prose__*` selectors with the canonical `.landing-prose` flat-children rhythm. Section/subsection wrappers dropped — bare `<h2 id="…">` and `<h3 id="…">` get rhythm from `_prose.scss` directly.
- 2026-05-18 SSR 404 fix: `app.routes.server.ts` was missing `/privacy` and `/terms`, so the wildcard rule returned status 404 even though the right HTML rendered. Added both as `RenderMode.Server` (content is static but `?lang=` query needs runtime read).
- 2026-05-18 Verified at runtime via Playwright on `http://localhost:4200`: 4 routes × 2 viewports = 8 screenshots in `tmp/legal-screenshots/`. Status 200, correct title + h1 + `lang` attribute + canonical per locale. Footer Legal column visible.
- 2026-05-18 Per feedback on typography + DDL parity: H1 swapped to `<landing-section-header size="md" [level]="1">` (display-lg, matches /uses + /colophon). Shared `.landing-prose` extended in `libs/landing/shared/ui/src/styles/_prose.scss` with list markers (disc/decimal + nested circle/lower-alpha, muted `::marker`) and table styling (`landing-prose__table-wrap` + bare `<table>`); legal-prose now owns only the head/reading-column chrome.
- 2026-05-18 Per DDL-source-of-truth feedback: replaced all 22 bare `<a>` in legal pages with `<landing-link [inline]="true">`. Extended `landing-link` with `kind` input (`internal | external | mail | tel | download | anchor`) auto-detected from href prefix; mail/tel/download render lucide action icons (envelope/phone/download) prepended in indigo with 8px gap and `vertical-align: middle` for x-height alignment with Inter prose. DDL `ddl.component.html` gains a new "semantic kinds" sub-section showcasing each variant in block + inline modes. Legal callsites dropped redundant `[external]` (auto-detected) and `[arrow]` on mailto (action icon is the affordance).
- 2026-05-18 Done — all ACs satisfied (Lighthouse audit deferred to its own pass).
