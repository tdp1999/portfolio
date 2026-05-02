# Task: /uses page (sub-page quieter tone)

## Status: pending

## Goal
Build the `/uses` page listing hardware, editor, terminal, CLI, browser, fonts, and other daily tools — written specifically (Procida Rule 4), not generically.

## Context
Sub-pages follow D1 quieter rule: same vocab as home but accent restrained, no blueprint background, more whitespace. `/uses` and `/colophon` keep the same tone as home (D2 rule — no playful delta).

## Acceptance Criteria
- [ ] Page header: eyebrow + H1 "Uses" + 1-line subline (e.g., "What I reach for daily")
- [ ] Sections grouped by category — Hardware / Editor / Terminal / CLI / Browser / Fonts / Other (final grouping per E2 or content authoring task 297)
- [ ] Each entry: name + 1-line specific reason (Rule 4 — "iTerm2 with Solarized Dark", not "modern terminal")
- [ ] Outbound links to product/tool pages via `landing-link` with `↗`
- [ ] No imagery; no B2.c lift; sub-page quiet treatment
- [ ] Statically prerendered

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
