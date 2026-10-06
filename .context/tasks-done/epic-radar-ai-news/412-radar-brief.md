# Task: Radar — synthesize step and Brief page

## Status: done

## Goal
Produce a catch-up brief for a time window and show it in the console.

## Context
Epic `epic-radar-ai-news` (Phase B). Bridges the Owner's one-year gap: a single page of what changed per provider, new terms and a timeline.

## Acceptance Criteria
- [x] The Owner requests a brief for a window from the console; the API creates a pending synthesize job.
- [x] `/radar work brief` claims it, reads the window's enrichments, and submits one `RadarBrief` (markdown) grouped by provider and topic.
- [x] The brief lists new terms with the date of the first item that mentions each, and links every claim to its source item.
- [x] The Brief page lists briefs newest first and renders one as markdown with links to item Detail pages.
- [x] If the window contains no enriched items, then the API refuses the request with a message instead of creating an empty brief.

## Technical Notes
- The `RadarBrief` row is the job (its own `workStatus` + `leaseExpiresAt`); no run, no `SYNTHESIZE` step run (415 keeps SYNTHESIZE out of `RadarRun.PIPELINE`). Claim reuses `RadarLeasePolicy` and the one-statement `SKIP LOCKED` pattern of item claim.
- Scope (Owner, 2026-10-06): all sources by default, optional single-source filter (`sourceId` nullable). One brief waiting at a time (PENDING or CLAIMED blocks a new request).
- New terms live in the markdown body (no terms column). The API rejects a result whose item links point outside the brief's window.
- Item links in the body: `[label](/radar/items/<id>)`; the console routes them in-app.
- Large windows: the skill summarizes per month first, then merges, to stay within one session.
- Domain: `RadarBrief` entity in `domain/entities/` (one file, one job); specs via be-test.
- **Specialized Skill:** be-test

## Files to Touch
- apps/api/src/modules/radar/application/commands/brief.*.command.ts
- apps/api/src/modules/radar/presentation/*.controller.ts
- libs/console/feature-radar/src/lib/radar-brief.list/**, radar-brief.detail/**, radar-brief.create.dialog/**
- .claude/skills/radar/SKILL.md

## Dependencies
- 404, 405, 407

## Complexity: M

## Progress Log
- 2026-10-06 Started. Verified against the code: `RadarBrief` model already carries work status and lease, so the brief row is the job (task note about a SYNTHESIZE step kind was stale); `RadarEnrichment` has no terms column, so the worker derives new terms. Owner chose: all sources + optional filter, terms in markdown, one waiting brief at a time.
- 2026-10-06 Using be-test for the RadarBrief entity, SubmitBriefHandler and the repository claim/window/save (12 tests, all 174 radar tests pass).
- 2026-10-06 API, console (Briefs list, New brief dialog, brief detail with in-app item links, Feed "Briefs" button), `radar-api.sh` brief-claim/brief-items/brief-submit and SKILL.md section 5 done; feature guide section 16 added. Claim now returns `sourceId` (was a hard-coded `source: null`). `.radar-md` styles moved to `_radar-md.scss` with `::ng-deep` so they reach `[innerHTML]` content on the item Detail page too. `nx build console` passes.
- 2026-10-06 End-to-end on local (worker pointed at localhost; production has no brief endpoints until deploy): brief requested in the console (Sep 6 to Oct 6, all sources, 13 posts), claimed and written with `/radar work brief`, a submit with an out-of-window link returned `RADAR_BRIEF_INVALID_LINKS` with `outsideItemIds`, the real submit stored 13 posts; list shows Ready, detail renders the markdown, item links route in-app with no reload. Fixes from the visual check: list markers restored in `_radar-md.scss` (Tailwind preflight removed them, item Detail too); SKILL.md now says no `#` title and readable link labels.
- 2026-10-06 Done — all ACs satisfied
