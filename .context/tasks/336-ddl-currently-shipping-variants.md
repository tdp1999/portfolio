# Task: Currently-shipping variants on `/ddl/about-signatures`

## Status: pending (blocked on task 328 v2 — /now content shape decision)

## Goal
Design and render 2-3 visual variants of the "Currently shipping" signature — a tight live-status surface on /about that subscribes to /now data and links out to the full /now page.

## Context
Per epic C2, `/now` was originally markdown-driven (task 328) but author has pivoted to console-managed. Task 328 must be re-spec'd to choose a content shape (freeform / structured 4 fields / hybrid) before this task can ship its final variants. Mock data can be used for early variant exploration.

## Blocking Dependency
**Task 328 v2 must define the /now content shape before this task fully ships.** Options being decided:
- (a) Freeform translatable text (single `body` field per locale)
- (b) Structured 4 fields: `nowBuilding`, `nowWriting`, `nowLearning`, `lastShipped`
- (c) Hybrid: structured + freeform appendix

Until that's decided, this task can start with mock data assuming option (b) — structured 4 fields — since that maps cleanest to a status strip.

## Acceptance Criteria
- [ ] 2-3 visual variants rendered side-by-side under "3. Currently shipping" section in `/ddl/about-signatures`
- [ ] Each variant subscribes to the (real or mocked) /now data source — service signature TBD by task 328 v2
- [ ] Variants explore DISTINCT visual treatments — examples (assuming structured 4-field shape):
  - **V1 — Status strip:** 4 rows: "Building / Writing / Learning / Last shipped" with values + "Last updated YYYY-MM-DD" footer + link "See /now →"
  - **V2 — Card with prose:** single card with prose paragraphs auto-flowing from 4 fields + small metadata footer
  - **V3 — Terminal-styled:** monospace pseudo-terminal output (`> now.building → ...`) signaling craft + linking out
- [ ] All variants include "Last updated YYYY-MM-DD" + link "See /now →"
- [ ] If /now data is null/empty (no entry yet), variant degrades gracefully with "Nothing to share yet" + link
- [ ] EN + VI render correctly
- [ ] Type-check + landing prod build clean
- [ ] If task 328 v2 ships before this task — use real data; otherwise, use a mock factory and note in progress log

## Technical Notes
- Data shape consumer abstracted behind a service interface — if task 328 v2 ships a different shape (e.g., freeform markdown), this task adapts by mapping at the variant component layer.
- Variants must NOT contain hardcoded "currently shipping" copy — pure consumers of /now data, with link to `/now` for the full version.
- Last-updated date comes from the /now data source (per task 328 v2 spec) — surface it explicitly.
- Terminal variant (V3) is opinionated and polarizing — render it but make sure HR-persona reading is still legible (no actual interactivity required).

## Files to Touch
- DDL page sub-folder per variant: `ddl-about-signatures/currently-shipping-v1/`, etc.
- DDL page template (mount variants in section 3)
- (After 328 v2) shared service for /now consumption — likely `libs/landing/shared/data-access/src/lib/now.service.ts`

## Dependencies
- 333 (DDL scaffold)
- Task 328 v2 (/now content shape decided — separate task)

## Complexity: M

## Progress Log
