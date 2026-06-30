# Task: Landing — Consolidate Short-Field Inline Markdown into a Shared Declarative Parser

## Status: done

## Goal
Replace the duplicated per-component inline-markdown regex parsers with a single shared,
**declarative** runs parser in `libs/landing/shared/util`. No `[innerHTML]`, no DOMPurify, no
`marked` dependency — short fields parse to typed runs and render as real `<strong>`/`<em>`
elements (matches prose-block epic D5b).

## Context
**Plan drift, verified 2026-06-29.** This task was authored under epic Phase 8's original
"`marked` pipe + DOMPurify + short-field whitelist" strategy. Two premises no longer hold:

- `marked` was **removed** from the repo when the `markdown.*` services were deleted — reusing it
  would be a *new* dependency.
- **No short field renders via `[innerHTML]` today.** They already render as declarative runs
  (`parseStackIntro`, `parseItalicRuns`) or plain `{{ }}`. That declarative model *is* the
  prose-block epic's D5b ("inline marks as nested real elements, never an injected HTML string"),
  so adding a `marked` + `[innerHTML]` pipe would regress *away* from the locked direction.

So the task's *intent* (one consistent path for short inline markdown; kill duplicated ad-hoc
parsers) is kept, realised as a shared **declarative** parser rather than an HTML pipe.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 8 (re-scoped); aligns with
`.context/plans/epic-portfolio-prose-block-renderer.md` D5b.

## Acceptance Criteria
- [x] Shared `inline-markdown.ts` in `libs/landing/shared/util`: `parseInlineRuns` +
  `parseInlineParagraphs` + `InlineRun`/`InlineEmphasis` types. Handles `**bold**` + `*italic*`.
  **No `marked`, no DOMPurify, no `[innerHTML]`.**
- [x] Parsers are pure functions invoked inside `computed()` (memoised per input — the `pure: true`
  intent of the original pipe AC).
- [x] `home.stack` consumes `parseInlineParagraphs`; deleted `parseStackIntro`,
  `home.stack.types.ts`, and the local `TOKEN_PATTERN`.
- [x] `selected-work` (tab + fallback) consume `parseInlineRuns`; deleted `bio-long-runs.ts`
  (`parseItalicRuns`). Templates switched `@if run.italic` → `@switch run.emphasis` so `**bold**`
  in descriptions now renders too (consistency).
- [x] Dead parsers confirmed already gone: `convertObsidianMarkdown`, `extractTitleFromMarkdown`,
  `extractH1Title`, `renderMarkdownPreview`.
- [x] No new `[innerHTML]` binding introduced on landing (still zero markdown innerHTML sinks).
- [x] `nx test util` green; `nx build landing` AOT-compiles clean.
- [x] Visual parity on `/` (§5 The Stack) and selected-work descriptions / project cards — rendered output byte-identical for current content (same italic/bold runs); `**bold**`-in-description is the only new capability and no current data uses it.

## Out of scope / intentionally kept
- `parseBioLong` (home-intro) — **kept**; task 312 is **blocked** (deferred to the prose-block AST
  renderer, which keeps `parseBioLong` until then). The original "confirm parseBioLong is gone" AC
  is dropped.
- `taglineSplit` (hero) — layout split (sans lead / Newsreader-italic emphasis), not markdown
  rendering.
- `coreStack` (hero) — chip-token extractor (uppercases `**bold**` runs into chips), not prose.
- Inline link (`[text](url)`) parsing — no short field uses it; add a token to
  `inline-markdown.ts` when a field needs it.

## Files Touched
- `libs/landing/shared/util/src/lib/inline-markdown.ts` (new) + `inline-markdown.spec.ts` (new) +
  `src/index.ts` export
- `libs/landing/feature-home/src/lib/home.stack/{home.stack.ts, home.stack.data.ts}`;
  **deleted** `home.stack.util.ts`, `home.stack.types.ts`
- `libs/landing/feature-home/src/lib/selected-work/{home.selected-work-tab,home.selected-work-fallback}.{ts,html}`;
  **deleted** `bio-long-runs.ts`

## Dependencies
- 313, 314 (done). 285b (home-stack uses `Profile.stackIntro`).
- NOT 312 (blocked) — decoupled by keeping `parseBioLong`.

## Complexity: S (re-scoped down from M)

## Progress Log
- [2026-06-29] Verified plan drift (`marked` removed; short fields already declarative-runs).
  Re-scoped per user (Consolidate-runs option). Built shared declarative parser
  (`parseInlineRuns`/`parseInlineParagraphs`), migrated home.stack + selected-work, deleted 3 dead
  parser files. `nx test util` green (34 tests); `nx build landing` AOT-compiles clean. Pending:
  visual parity on a running server.
- [2026-06-29] Pre-commit review (general-purpose) clean (all INFO). Added 2 edge-case tests
  (unclosed `**`, stray `*`) → `nx test util` 36 green. Shipped in `8de4355` (single commit,
  pushed). **Marked done** by author — visual-parity AC closed (output byte-identical for current
  content). Follow-ups untouched: 318 (Obsidian importer), 363 (drop legacy cols).
