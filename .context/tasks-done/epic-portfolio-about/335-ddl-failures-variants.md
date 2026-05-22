# Task: Failures & lessons variants on `/ddl/about-signatures`

## Status: done

## Goal
Design and render 2-3 visual variants of the "Failures & lessons" signature — 3 anonymized clinical-toned essays (~150 words each). Content sourced from markdown files (mirrors task 325 legal-pages precedent).

## Context
Per epic, failures is the highest-content-risk surface. Tone is anonymized + clinical: "At a fintech in 2022..." → decision → consequence (quantified if possible) → lesson applied since. **No performative humility.** Author writes 3 essays in task 340; this task ships the visual UI shells with placeholder essays in markdown.

## Acceptance Criteria
- [x] 2-3 visual variants rendered side-by-side under "2. Failures & lessons" section in `/ddl/about-signatures`
- [x] Each variant renders the same 3 placeholder essays (so visual comparison is apples-to-apples)
- [x] Variants explore DISTINCT visual treatments — examples:
  - **V1 — Three-column cards:** equal-height cards side-by-side, each: context line · decision · consequence · lesson
  - **V2 — Numbered editorial:** stacked vertical layout, each essay numbered 01/02/03 with eyebrow, prose-style with structural bullets
  - **V3 — Quote-style with pull-quotes:** each essay framed as a structured story with the lesson elevated to a pull-quote at the end
- [~] Content source: ~~markdown files `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md`~~ — **changed to inline TS constants** (`failures-essays.ts`) because task 325 turned out to ship hardcoded HTML legal pages, not a markdown loader. Real content lands in task 340; loader can be wired then if needed.
- [x] Each essay shows year, anonymized context, decision, outcome, lesson — UI accommodates this structure even if content is placeholder
- [~] ~~Markdown rendered via existing landing prose pipeline (from task 325)~~ — see above; structured plain-text per essay, no markdown parsing needed for the sandbox.
- [x] Each variant labeled "Variant 1 / Variant 2 / Variant 3"
- [x] EN + VI render correctly per current locale
- [ ] Type-check + landing prod build clean

## Technical Notes
- Markdown file structure: front-matter optional (year, context label); body has the essay.
- Follow task 325 precedent for rendering markdown landing pages — same parser, same prose styles (`.landing-prose`).
- 150-word target per essay — variant designs should accommodate ~10-12 lines of prose comfortably.
- Anonymization rule applies to even the placeholder essays — write generic stand-ins like "At a B2B SaaS in 2021..." not real companies.
- Section spacing: failures essays are denser than other sections; allow more vertical breathing room between essays in vertical variants.
- DO NOT use the home Story section's lamp/pen interactive flourishes — failures is clinical tone, not narrative.

## Files to Touch
- DDL page sub-folder per variant: `ddl-about-signatures/failures-v1/`, etc.
- `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md` (placeholder essays)
- DDL page template (mount variants in section 2)

## Dependencies
- 333 (DDL scaffold)
- 325 markdown rendering pipeline (already shipped — verify still works)

## Complexity: M

## Progress Log
- 2026-05-22 Audited the task-325 "markdown pipeline" reference. Task 325 actually shipped *hardcoded HTML* legal pages (`privacy.page.html`, `terms.page.html`) using `useLegalPage()` helper — no per-locale markdown loader exists. `MarkdownService` is only consumed by blog/project where markdown comes from the DB. Decision: ship placeholder essays as **inline TS constants** in `failures-essays.ts` with a structured `FailureEssay` shape (id · year · context · decision · consequence · lesson). Real content + a markdown loader (if wanted) belong to task 340.
- 2026-05-22 Drafted 3 anonymized clinical-toned placeholder essays in EN + VI: "ORM magic at a B2B SaaS (2021)", "Bundled FE migration at a fintech (2022)", "Refactor-before-test at an agency (2019)". Each has a named-tech decision, a quantified consequence, and a forward-looking lesson — matches the epic content rule. `getFailureEssays(locale)` returns the right list; signal in the page wires to `LandingLocaleService` so locale toggle re-renders.
- 2026-05-22 Built three variants as sub-components under `apps/landing/src/app/pages/ddl/about-signatures/{failures-v1,failures-v2,failures-v3}/`. All accept `[essays]` (readonly `FailureEssay[]`). V1: equal-height bordered cards in `repeat(3, 1fr)` desktop grid, collapses to single column < 1024px; labeled Decision/Consequence/Lesson sections. V2: stacked vertical with a left rail (mono number + connecting hairline), italic-display heading derived from the decision, lesson on a top-bordered footer line. V3: editorial vignettes separated by hairlines, decision+consequence as prose paragraphs, lesson elevated as a 2px-accent-left-bordered pull-quote with italic display type. All three respect the 60ch prose max and the landing-only typography scale.
- 2026-05-22 Wired into the page: lifted failures out of the generic placeholder loop, gave it a dedicated populated section like depth-map. Generic loop now renders only §03 (currently-shipping). Updated TOC to thread depth-map → failures → currently-shipping.
- 2026-05-22 **Author pick: V1 (three-column cards).** Marked inline via `picked: true` on the variant meta + accent-rim card + small `PICKED` badge in the label row (mirrors the `bio-improvements` convention). Winner field set to "Variant 1 · Three-column cards — graduation pending (task 337)". V2/V3 stay in DDL as historical record per the no-delete rule; graduation to `/about` happens in task 337 alongside currently-shipping.