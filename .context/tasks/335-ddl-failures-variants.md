# Task: Failures & lessons variants on `/ddl/about-signatures`

## Status: pending

## Goal
Design and render 2-3 visual variants of the "Failures & lessons" signature — 3 anonymized clinical-toned essays (~150 words each). Content sourced from markdown files (mirrors task 325 legal-pages precedent).

## Context
Per epic, failures is the highest-content-risk surface. Tone is anonymized + clinical: "At a fintech in 2022..." → decision → consequence (quantified if possible) → lesson applied since. **No performative humility.** Author writes 3 essays in task 340; this task ships the visual UI shells with placeholder essays in markdown.

## Acceptance Criteria
- [ ] 2-3 visual variants rendered side-by-side under "2. Failures & lessons" section in `/ddl/about-signatures`
- [ ] Each variant renders the same 3 placeholder essays (so visual comparison is apples-to-apples)
- [ ] Variants explore DISTINCT visual treatments — examples:
  - **V1 — Three-column cards:** equal-height cards side-by-side, each: context line · decision · consequence · lesson
  - **V2 — Numbered editorial:** stacked vertical layout, each essay numbered 01/02/03 with eyebrow, prose-style with structural bullets
  - **V3 — Quote-style with pull-quotes:** each essay framed as a structured story with the lesson elevated to a pull-quote at the end
- [ ] Content source: markdown files `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md` — author writes real essays in task 340; ship 3 placeholder essays for v1 of DDL
- [ ] Each essay shows year, anonymized context, decision, outcome, lesson — UI accommodates this structure even if content is placeholder
- [ ] Markdown rendered via existing landing prose pipeline (from task 325)
- [ ] Each variant labeled "Variant 1 / Variant 2 / Variant 3"
- [ ] EN + VI render correctly per current locale
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
