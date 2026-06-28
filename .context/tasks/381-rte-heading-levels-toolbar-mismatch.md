# Task: RTE — Toolbar heading options don't match configured levels

## Status: pending

## Goal
Make the editor's block-type dropdown offer exactly the configured heading levels (semantic = H2/H3/H4), instead of a hardcoded H1/H2/H3 set.

## Context
Found during task 311. `rte-tiptap.config.ts` sets `heading: { levels: [2, 3, 4] }` for semantic mode, but the document-engine toolbar's block-type select offers labels "Heading 1 / Heading 2 / Heading 3" mapped to levels 1/2/3.

Verified emitted tags (Playwright, console Profile bioLong editor, 2026-06-28):
- "Heading 1" → `<p>` (level 1 not in config → no-op; **no `<h1>` leak — semantically safe**)
- "Heading 2" → `<h2>`
- "Heading 3" → `<h3>`

So: the level-1 option is dead/confusing, and **H4 (allowed by config) is unreachable** from the toolbar. The toolbar derives its options independently of `heading.levels`.

## Acceptance Criteria
- [ ] Toolbar block-type dropdown lists exactly the configured levels (semantic: H2/H3/H4), no dead level-1 entry, H4 reachable.
- [ ] Labels are unambiguous (either real level numbers or "Heading 2/3/4").
- [ ] No `<h1>` can be produced by content editors (preserve current safe behavior).

## Technical Notes
- Investigate whether `@phuong-tran-redoc/document-engine-angular` exposes a toolbar/block-type config to drive heading options from `heading.levels`. If not, this is an upstream engine limitation — file/patch there, or wrap the toolbar config in `libs/shared/features/rte-tiptap`.
- Touches `libs/shared/features/rte-tiptap/src/lib/rte-tiptap.config.ts` (config) — NOT the console swap (task 311).

## Dependencies
- 307-rte-tiptap-concrete (config lives there)

## Complexity: S

## Progress Log
- [2026-06-28] Created from task 311 discovery (verified tag emission above).
