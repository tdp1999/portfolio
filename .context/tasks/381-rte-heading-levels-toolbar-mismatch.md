# Task: RTE — Toolbar heading options don't match configured levels

## Status: done (pending visual verify after console dev-server restart)

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
- [2026-07-23] Root cause confirmed: engine toolbar built its block-type dropdown from a
  hardcoded `HEADING_OPTIONS` ([Normal, H1, H2, H3]) in `constants/text-style.constant.ts`,
  ignoring `config.heading.levels` — hence the dead H1 and the unreachable H4. The toolbar
  already receives `[config]`, so the fix is upstream (engine), not a consumer wrap.
  Implemented in `~/Code/work/document-engine` (working tree, not committed): added
  `buildHeadingOptions(levels)` + `HeadingOption`/`DEFAULT_HEADING_LEVELS`, and
  `ToolbarComponent.ngOnInit` now derives `headingOptions` from `config.heading.levels`
  (falls back to 1–6 when unset). Unit test `text-style.constant.spec.ts` (7 cases) + build
  + lint green. `HEADING_OPTIONS` was never a public export → no breaking change.
  PENDING: engine must release the fix (auto-cut → next patch, e.g. 0.1.4) and portfolio dep
  bumped to it. No portfolio code change needed — SEMANTIC config already sets
  `heading: { levels: [2, 3, 4] }`, so the corrected toolbar will offer exactly H2/H3/H4.
- [2026-07-23] Released & wired. Engine fix shipped as **document-engine 0.1.4** (PR #44 →
  auto-cut `v0.1.4` → gated CI publish, OIDC + provenance, both packages on npm `latest`).
  The public API grew one additive export (`HeadingOption`) — api-extractor report regenerated,
  security-gate green. Portfolio deps bumped `0.1.2 → 0.1.4` (`pnpm install`), `rte-tiptap`
  consumer type-checks clean. REMAINING: console dev-server restart to drop the stale 0.1.2
  bundle, then confirm the semantic editor dropdown lists exactly Normal/Heading 2/3/4.
