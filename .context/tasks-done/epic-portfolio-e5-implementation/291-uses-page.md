# Task: /uses page (sub-page quieter tone)

## Status: done

## Goal
Build the `/uses` page listing hardware, editor, terminal, CLI, browser, fonts, and other daily tools — written specifically (Procida Rule 4), not generically.

## Context
Sub-pages follow D1 quieter rule: same vocab as home but accent restrained, no blueprint background, more whitespace. `/uses` and `/colophon` keep the same tone as home (D2 rule — no playful delta).

## Acceptance Criteria
- [x] Page header: eyebrow + H1 "Uses" + 1-line subline (e.g., "What I reach for daily")
- [x] Sections grouped by category — Hardware / Editor / Terminal / CLI / Browser / Fonts / Other (final grouping per E2 or content authoring task 297)
- [x] Each entry: name + 1-line specific reason (Rule 4 — "iTerm2 with Solarized Dark", not "modern terminal")
- [x] Outbound links to product/tool pages via `landing-link` with `↗`
- [x] No imagery; no B2.c lift; sub-page quiet treatment
- [x] Statically prerendered

## Technical Notes
- Content authoring is task 297 (P6.4); this task is the page shell + section component.
- Markdown content if P6 picks Markdown-in-repo strategy.

## Files to Touch
- `libs/landing/feature-uses/src/uses.page.ts`
- `libs/landing/feature-uses/src/uses-section.component.ts`

## Dependencies
- 274, 276, 278
- 297 (content) — page can land empty first, content lands later

## Complexity: S

## Progress Log
- 2026-05-16 Started — chose to enhance the existing `apps/landing/src/app/pages/uses/` shell (already wired in `app.routes.ts` + `app.routes.server.ts` for prerender) rather than spinning up a new `libs/landing/feature-uses` lib for a fully static page. Adds `uses-section` component for the per-category sections and seeds Procida-Rule-4 entries that task 297 will replace.
- 2026-05-16 Done — `uses.page.ts` + `uses.page.html` + `uses-section.component.ts` shipped. `landing:build:development` prerenders `/uses` (4 static routes total). Playwright probe at 1280×900 confirmed: H1 "Uses", eyebrow `07 / Uses`, 7 section H2s with `#`-anchor links, 14 entries, 14 outbound `target=_blank` `landing-link` arrows, no console errors. Reuses landing primitives (`landing-section-header`, `landing-breadcrumb`, `landing-heading`, `landing-link`) per reuse-first rule. No imagery, no B2.c lift, subline in `text-landing-text-500` — sub-page quiet tone.
