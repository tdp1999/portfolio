# Task: Landing `/now` page (markdown-driven)

## Status: pending

## Goal
Ship a standalone `/now` page on landing that mirrors the Derek-Sivers-style "what I'm focused on right now" convention — a single markdown file rendered as a dated update, refreshed roughly monthly.

## Context
The `/now` convention (nownownow.com, Derek Sivers, ~2015) is a one-page snapshot of current focus: what the person is working on, learning, where they are, what they care about *this month*. It is intentionally different from `/about` (timeless) and a blog (long-form).

For a portfolio dev in 2026, `/now` is a low-cost, high-signal honesty channel: recruiters and collaborators learn the current bandwidth + interests without a DM. User committed to monthly-update cadence 2026-05-19 — the page only works if it stays fresh, so the authoring path must be friction-free (single markdown file, no console UI, no DB).

Originally tracked as C19 inside `epic-portfolio-contact.md` but extracted as standalone — it has no dependency on the contact pipeline and is explicitly post-launch.

## Acceptance Criteria
- [ ] `/now` route added to landing app (SSR, `RenderMode.Server`)
- [ ] Content sourced from a single markdown file (e.g. `apps/landing/src/content/now.md` or `content/now/index.md`) — no DB, no console editor
- [ ] Page renders: eyebrow + heading via shared `landing-page-hero` (F1 primitive), "Last updated YYYY-MM-DD" line, markdown body via the landing prose pipeline
- [ ] Frontmatter or first-line declares last-updated date; surfaced both on-page and in `<meta>` (og:updated_time)
- [ ] EN + VI locales supported via the existing landing-i18n pattern (separate `now.en.md` / `now.vi.md` or one file with locale sections — pick whichever matches the legal-pages task 325 precedent)
- [ ] Linked from landing footer (or wherever `/uses`, `/colophon` are linked) so it is discoverable
- [ ] Meta/title set explicitly so the F6 fix (LandingMetaService) does its job — title = "Now — Phương Trần" / "Hiện tại — Phương Trần", description = the lede
- [ ] Listed in `llms.txt` (task 323) once that ships — note in 323 follow-ups, not a hard dep here
- [ ] Type-check + landing prod build clean

## Technical Notes
- Follow the **task 325 (landing-legal-pages)** precedent for markdown-driven landing pages: same file layout, same prose pipeline, same i18n shape. Do not invent a new rendering path.
- Use **`landing-page-hero`** (shipped C20) for the header; do not redeclare hero SCSS.
- Use **`.landing-prose`** for the body — extended by task 325 with list markers + table styling, already covers what `/now` needs.
- **No status badge, no "available/slow/away"** — explicitly rejected in the contact epic. The free-form prose body is the only "what I'm doing" surface.
- **No CMS, no console UI** — authoring is a markdown edit + commit. Keeping the loop short is what makes monthly updates realistic.
- Lowest-priority polish item — schedule after launch.

## Files to Touch
- `apps/landing/src/app/pages/now/` (new page component + route)
- `apps/landing/src/content/now.{en,vi}.md` (or wherever 325 placed legal markdown)
- Landing routes config
- Landing footer / nav links (wherever `/uses` and `/colophon` are linked)

## Dependencies
- 325 (landing-legal-pages) — markdown-driven landing page precedent
- Epic-portfolio-contact C20 (landing-page-hero) — already shipped, prerequisite primitive

## Complexity: S

**Reasoning:** No new infrastructure — page composition over shipped primitives (`landing-page-hero`, `.landing-prose`, markdown pipeline from 325). Single new route, single content file per locale, one footer link. Most of the cost is content authoring (the first update), not engineering.

## Progress Log
