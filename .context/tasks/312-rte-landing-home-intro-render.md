# Task: Landing — Replace `home-intro` Custom Parser with `<rte-render-html>`

## Status: blocked

## Blocker
Deferred (2026-06-28) until `epic-portfolio-prose-block-renderer` (AST renderer) opens.
`home-intro` is an interactive **per-paragraph** consumer: the lamp-aim, pen-dock,
`is-active`/`is-dim`, and per-paragraph underline SVG are all keyed to `#storyPara`
`viewChildren` + per-`<p>` bindings. `<rte-render-html>` (AC #2) dumps the whole bio into
one `[innerHTML]` div and structurally cannot expose per-paragraph Angular handles — so the
literal swap kills the signature interaction. The clean tool is the future `<rte-render [doc]>`
+ `rte-element`/`rte-inline` (declarative per-node, D5b), which that epic deliberately holds
until a 2nd block type is needed. Migrate `home-intro` to `<rte-render [doc]>` then; keep
`parseBioLong` until that point. Phase 6 still proceeds for the passive consumers
(blog-detail, project-detail) where `<rte-render-html>` fits.

Data is already in place (API returns `bioLongJson` + `bioLongHtml` + `bioLongSchemaVersion`),
so re-opening is a FE-only change.

## Goal
Drop the `parseBioLong` custom parser from `home-intro.component.ts` and render the API-provided `bioLongHtml` via the shared renderer.

## Context
First wave of landing parser cleanup. `home-intro` (task 282) currently consumes `Profile.bioLong` (Markdown-ish) and calls a custom regex parser for `*phrase*` italics. After this task, it consumes the pre-sanitized `bioLongHtml.en` (or `.vi` later) and the renderer applies whitelist sanitization.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 6.

## Acceptance Criteria
- [ ] `home-intro.component.ts` no longer imports or calls `parseBioLong`.
- [ ] Template uses `<rte-render-html [html]="profile().bioLongHtml.en">`.
- [ ] Landing `Profile` data-access type updated to expose `bioLongJson` + `bioLongHtml` + `bioLongSchemaVersion`. Old `bioLong` may stay during transition if other readers exist; flag for cleanup in task 317.
- [ ] Visual parity verified on `/` against pre-task screenshot (chrome-devtools MCP per `.context/design/visual-feedback.md`).
- [ ] No `[innerHTML]` binding without `| safeHtml` introduced (lint rule still passes).
- [ ] Lighthouse Perf score on `/` does not regress (≥ existing baseline).

## Technical Notes
- Typography wraps: the existing `.text-section-body-prose` (or whichever class wraps the section) should style `<p>`, `<em>`, `<strong>` from the rendered HTML directly. No template-side word-wrapping needed.
- Italic semantic: `<em>` from RTE = Newsreader serif italic per E4 typography pair. Verify CSS resolves correctly.
- Editor is *not* loaded on the landing page — only the renderer.

## Files to Touch
- `libs/landing/feature-home/.../home-intro.component.{ts,html}`
- Landing `Profile` type / mapper in `libs/landing/data-access/**`

## Dependencies
- 305-rte-prisma-migrations
- 308-rte-renderer-lib
- 310-rte-be-service (so the API actually returns `bioLongHtml`)
- 311-rte-console-editor-swap (so an admin can produce `bioLongHtml` via the editor)

## Complexity: S

## Progress Log
- [2026-06-28] Investigated; blocked/deferred to prose-block-renderer epic (AST renderer needed to preserve the per-paragraph lamp/pen interaction). See Blocker.
