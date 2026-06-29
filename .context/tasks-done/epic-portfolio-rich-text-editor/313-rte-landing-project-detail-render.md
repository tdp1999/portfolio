# Task: Landing — Project Detail Page Renders Rich-Text Body & Highlights

## Status: done

## Goal
Wire `<rte-render-html>` into the project detail page (D3.c) for `Project.body` and each `TechnicalHighlight.{challenge,approach,outcome}`.

## Context
Second wave of landing parser cleanup. Depends on the project detail page existing (task 290 from E5 phase 5). Replaces whatever placeholder body rendering 290 ships with.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 6.

## Acceptance Criteria
- [x] Project detail page sections (`Project.sections[*].body`) render through `<rte-render-html>` if section bodies migrate to the rich-text pattern. **Decide during this task** whether `Project.sections` body is rich-text or kept as plain markdown — document the decision in `.context/decisions.md`. → **No `Project.sections` field exists**; body is a single rich-text field. Documented in ADR-019.
- [x] `Project.body` renders via `<rte-render-html [html]="project().bodyHtml.en">`. (Rendered via `contentHtml()` = `addHeadingAnchors(bodyHtml.locale)`, with `contentClass="landing-prose"` so prose rhythm holds.)
- [x] Each `TechnicalHighlight` renders 3 RTE blocks (challenge / approach / outcome). (Via `highlightBlocks()` — prefers `*Html`, falls back to escaped plain text mid-migration.)
- [x] Sticky sidebar ToC (D3.c) still works against the rendered HTML. No editor/`tocAnchors` IDs exist → added read-time slugger `addHeadingAnchors` (data-access) + whitelisted `id` on h2-h4 only (shared rte-core hook). *Runtime ToC scroll behavior to be eyeballed once the dev server is restarted.*
- [x] No Tiptap loaded on this route. (Renderer-only; also dropped `MarkdownService` → `marked`/`shiki` no longer pulled into the projects route chunk.) *First-load JS budget: build succeeds; precise per-route delta to confirm (dompurify added ~browser-only, marked/shiki removed).*
- [x] Visual: code blocks render as semantic `<pre><code>` **without syntax highlighting** (RTE `generateHTML` emits plain `<pre><code>`, no Shiki on this route). *Pull-quote/blockquote visual parity to be eyeballed on the restarted dev server.*

## Technical Notes
- Code-block highlighting: **deferred for V1** (decided 2026-06-10). Render plain `<pre><code>`; do NOT add Shiki to `RichTextService` now. Future enhancement = a write-time Shiki transform in the BE service (would extend the whitelist with Shiki's `<span>` + `class`/`style`); track as a follow-up task when a case study actually needs it.
- `id` attrs on headings: `RICH_TEXT_WHITELIST` is defined **once** in the Angular-free `rte-core` lib (`@portfolio/shared/features/rte-core`) as the single source of truth. Import and **extend** it here — allow `id` on h2/h3/h4 only (not on `<a>`, to avoid anchor spoofing); never redefine the list. The renderer pipe and the BE write-time path (task 310) both import the same constant from `rte-core` so write/read whitelists stay in parity (the BE imports it without bundling Angular).
- Use `chrome-devtools` MCP per `.context/design/visual-feedback.md` to verify the rendered page against the D3.c moodboard.

## Files to Touch
- `libs/landing/feature-projects/**/project-detail.component.{ts,html}` (created in task 290)
- `libs/shared/features/rte-renderer/**` (whitelist extension if needed)
- `apps/api/src/modules/shared/rich-text/**` (whitelist parity)
- `.context/decisions.md` (Project.sections body decision)

## Dependencies
- 290-project-detail-page (creates the page)
- 305 / 308 / 310 / 311 (full RTE stack)

## Complexity: M

## Progress Log
- [2026-06-29] Started. Investigated current 2-mode render (markdown body vs synthesized fallback). Confirmed API returns bodyHtml + highlight {challenge,approach,outcome}Html; no Project.sections / tocAnchors fields. ToC fork resolved: **FE render-time slugger** (Option B) — landing util adds h2/h3 ids + extracts ToC, SSR-safe regex; whitelist extended to keep `id` on headings only.
- [2026-06-29] Implemented: data-access types (+bodyHtml, +{c,a,o}Html); `addHeadingAnchors` util + spec; component refactor (dropped MarkdownService/DomSanitizer, sync slugger computed, `highlightBlocks` with plain-text fallback); template body→`<rte-render-html contentClass=landing-prose>` + highlight CAO RTE blocks; `id` whitelist + heading-only strip hook in rte-core (+spec).
- [2026-06-29] **SSR blocker found & fixed:** `<rte-render-html>` pulled `isomorphic-dompurify` (jsdom, top-level `new JSDOM()`) into the ESM server bundle → prerender crash `__dirname is not defined` on `/projects` (also broke the user's dev SSR). Fix: `SafeHtmlPipe` sanitizes browser-only (server trusts the BE write-sanitized cache); new `sanitize-browser.ts` uses plain `dompurify`; constants imported via new `@portfolio/shared/features/rte-core/constants` path to keep the sanitizer out of the server graph. `<rte-render-html>` gained `contentClass`. Added `dompurify` direct dep. ADR-019 logged.
- [2026-06-29] Green: `nx build landing` prerenders cleanly; lint (4 libs) clean; specs pass — rte-renderer (3), rte-core (8, incl new id tests), addHeadingAnchors (5), BE rich-text.service (6).
- [2026-06-29] **Pending user action:** dev server needs a restart to pick up the new tsconfig path + `dompurify` dep + new chunks (HMR won't register them). Visual parity (body prose, blockquote, ToC scroll) + first-load size delta to verify after restart.
- [2026-06-29] Per user: moved `addHeadingAnchors` (+spec) out of data-access into `@portfolio/landing/shared/util` (`rte-headings`); also lifted the generic helpers `slugify`/`escAttr`/`decodeHtml` there (`html-text`), with `MarkdownService` re-importing them (keeps the dependency direction data-access → shared/util correct). Re-verified: util specs (10) pass, lint clean (util/data-access/feature-projects/rte-*), `nx build landing` prerenders clean.
- [2026-06-29] Done — visual parity confirmed on the restarted dev server (body prose, blockquote, code blocks, ToC scroll all correct). All ACs satisfied.
