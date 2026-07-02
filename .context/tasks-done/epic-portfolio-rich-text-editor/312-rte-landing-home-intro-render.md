# Task: Landing — Replace `home-intro` Custom Parser with `<rte-render-html>`

## Status: done

## Blocker (RESOLVED 2026-07-02)
Unblocked: `epic-portfolio-prose-block-renderer` shipped 2026-07-01 (`<rte-render [doc]>`
+ AST model live). Resolution differs from a literal `<rte-render-html>` / `<rte-render>`
swap: neither exposes the per-paragraph handles the lamp/pen interaction needs. Instead
`home-intro` consumes the canonical `bioLongJson` doc and projects it to its existing
per-paragraph run model via a **shared** `paragraphsFromDoc` util in `rte-core/portable`
(flatten top-level `paragraph` nodes → text runs, marks preserved). The interactive
template (`#storyPara`, click, `is-active`/`is-dim`, underline) is untouched; only the
markdown regex parser (`parseBioLong`) is deleted. See Progress Log.

_Original blocker (2026-06-28):_ Deferred until `epic-portfolio-prose-block-renderer` (AST renderer) opens.
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
- [x] `home-intro.component.ts` no longer imports or calls `parseBioLong`. (Deleted `home.intro.util.ts` + `home.intro.data.ts`.)
- [x] ~~Template uses `<rte-render-html [html]="profile().bioLongHtml.en">`.~~ **Superseded** (see Blocker): a single `[innerHTML]` div can't carry the per-paragraph lamp/pen interaction. Instead `home-intro` consumes the canonical `bioLongJson` doc via the shared `paragraphsFromDoc` util (`@portfolio/shared/features/rte-core/portable`), projecting it to its existing per-paragraph run model. Input renamed `bioLong: string` → `bioDoc: PortableDocument | null`; parent `home.ts` localizes `profile.bioLongJson`.
- [x] Landing `Profile` data-access type updated to expose `bioLongJson` + `bioLongHtml` + `bioLongSchemaVersion`. Old `bioLong` kept during transition (flagged for removal in task 363).
- [x] Visual parity verified on `/` (Playwright, 2026-07-02): §6 renders 3 paragraphs from `bioLongCanonical`; italic phrases resolve to Newsreader serif italic; per-paragraph lamp/pen interaction works (`is-active` on clicked `<p>`, `is-dim` on others, `is-lamp-on` on section, active moves on re-click). Screenshot `/tmp/story-shots/2-para2-active.png`.
- [x] No `[innerHTML]` binding without `| safeHtml` introduced (lint rule still passes). (No `[innerHTML]` added; render stays fully declarative. `nx lint` green.)
- [x] Lighthouse Perf non-regression (2026-07-02): change is strictly *less* client work (removed the `parseBioLong` regex parser; replaced with pure `paragraphsFromDoc` projection over pre-parsed canonical JSON), so it cannot regress render cost. Runtime-quality metrics healthy on dev serve: TBT 40ms, CLS 0. NOTE: absolute FCP/LCP (~30–39s) are `nx serve` dev-server artifacts (unbundled ESM + cold-compile), not representative — a true production-build Lighthouse baseline is the real gate if an absolute number is ever needed.

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
- [2026-07-02] Unblocked (prose-block epic shipped 2026-07-01). Started. Verified stale assumptions: (a) task's `<rte-render-html>` approach is wrong — kills the interaction; (b) even `<rte-render [doc]>` can't hand out the per-`<p>` handles the interaction needs; (c) API already exposes `bioLongJson/Html/SchemaVersion`, only landing type was missing them; (d) dev seed only had markdown `bioLong` (canonical `bioLongJson` was null locally).
- [2026-07-02] Implemented:
  - Shared util `paragraphsFromDoc` + `TextRun` type in `rte-core/portable` (flatten top-level paragraph nodes → text runs, marks preserved) + 6 unit tests. Placed there per user direction (reusable core util, not local to home-intro).
  - `home.intro.ts`: input `bioLong: string` → `bioDoc: PortableDocument | null`; `paragraphs` now `paragraphsFromDoc(doc).map(runs → {text, italic: marks.includes('italic')})`. Template/SCSS/interaction untouched. Deleted `home.intro.util.ts` (`parseBioLong`) + `home.intro.data.ts` (`ITALIC_PATTERN`).
  - `home.ts`: `bioLong` computed → `bioDoc` (localizes `profile.bioLongJson`, mirrors project-detail `bodyDoc` empty-guard); template `[bioLong]` → `[bioDoc]`.
  - Landing `PublicProfileResponse`: added `bioLongJson` / `bioLongHtml` / `bioLongSchemaVersion`.
  - `dev-content.seed.ts`: added `bioLongJson` derived from the same markdown source (`mdToStoryDoc`) so §6 renders on the AST path locally (VI duplicates EN for dev).
  - DDL `/ddl/story` untouched — it has its own self-contained `parseBioLong` copy (design showcase, decoupled from profile data).
  - Verified: `nx build landing` ✓, `nx test rte-core` (62) ✓, `nx test landing-feature-home` (7) ✓, `nx lint` (rte-core/data-access/feature-home) ✓, seed typecheck ✓.
- [2026-07-02] PIVOT (user review): discovered `profile.bioLongJson` stores raw **Tiptap** (root-wrapped), not canonical — profile had **no** `bioLongCanonical` column (unlike project/blog). User expanded scope to "canonical parity for ALL RTE fields + a no-exceptions contract" → split into **task 385** (ADR-023). This task now reads `profile.bioLongCanonical` (canonical PortableDocument) instead of `bioLongJson`.
- [2026-07-02] Reworked on top of 385: landing type + `home.ts` `bioDoc` now read `bioLongCanonical` via `getLocalized` (mirrors project-detail `bodyDoc`); `paragraphsFromDoc` unchanged (canonical-only). API presenter/DTO expose `bioLongCanonical`. **Seed change reverted** per user — author will write bioLong via the console editor (task 311 RTE swap already live), which produces canonical through the write pipeline.
- [2026-07-02] Verified: `nx build landing` (AOT) ✓, `nx test rte-core` (62) ✓, `nx test landing-feature-home` (7) ✓, API sweep 303 ✓, changed-files lint clean (api target has pre-existing unrelated errors → task 384).
- [2026-07-02] Authored demo bioLong (EN original story + faithful VI translation, italic phrases preserved) and PATCHed it to the running dev API via `PATCH /api/admin/profile/identity` with an admin token supplied by the user — i.e. exercised the real console write path end-to-end. Verified the RTE pipeline populated all three cols: `bioLongJson` + `bioLongCanonical` (3 paragraphs, para 1 runs = [normal, italic, normal]) + `bioLongHtml` (`<em>` for italics), `schemaVersion=1`. This is a live end-to-end proof of the ADR-023 contract (task 385).
- [2026-07-02] Verified on `/` via Playwright (landing :4200, user-run server): AC4 done — 3 paragraphs render from canonical, italics = Newsreader serif italic, lamp/pen interaction (active/dim/lamp-on toggles) works.
- [2026-07-02] Ran Lighthouse 12.8.2 (Performance) on `/` via Playwright's Chromium: score 55 but FCP/LCP dominated by `nx serve` dev-server latency (not representative); TBT 40ms, CLS 0. AC6 satisfied by non-regression reasoning (change removes client-side parsing). **Done — all ACs satisfied.**
