# Task: Landing — Blog Post Detail Renders Rich-Text Content

## Status: pending

## Goal
Replace `marked.parse(content)` in the blog post detail page with `<rte-render-html>` consuming `BlogPost.contentHtml`.

## Context
Third wave of landing parser cleanup. Blog posts already render server-side; the swap is read-only on the FE.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 6.

## Acceptance Criteria
- [ ] `post-detail.component.ts` no longer imports `marked` or any Markdown utility for the body. `marked` may stay in `package.json` for the Obsidian importer (task 318) but not in the runtime page bundle.
- [ ] Template uses `<rte-render-html [html]="post().contentHtml.en">` (`contentHtml` is the `{ en, vi }` envelope per task 305 — bind the active locale).
- [ ] Existing TOC + reading-progress-bar (Blog Post epic, Apr 2026) keep working. ToC selector should target the rendered headings (h2/h3) inside the RTE output container.
- [ ] Code blocks render as plain `<pre><code>` **without syntax highlighting in V1** (decided 2026-06-10 — Shiki deferred, same as task 313).
- [ ] No regression in /blog/:slug Lighthouse Perf score (existing E5 gate ≥ 80).

## Technical Notes
- Mark `marked` as a dynamic import only inside the Obsidian importer module so it's tree-shaken from the landing route bundle.
- The existing reading-progress-bar uses the page scroll height — no change needed.
- ToC scroll-spy uses heading IDs — confirm RTE headings include them (via task 313's `id` whitelist extension).

## Files to Touch
- `libs/landing/feature-blog/**/post-detail.component.{ts,html}`
- `libs/landing/feature-blog/**/post-detail.component.spec.ts` (regression: no `marked` import)
- `libs/landing/data-access/**` (BlogPost type: drop `content` markdown reads, use `contentHtml`)

## Dependencies
- 305 / 308 / 310 / 311

## Complexity: S

## Progress Log
