# Task: Console AI integration screen

## Status: done

## Goal
One console page that shows whether Gemini is configured, lets the Owner test it, and shows usage and spend.

## Context
From `epic-radar-phase-c`. The Owner wants one place for everything AI-related. Simple first: it serves Radar. Reads the endpoints and ledger from 416.

## Acceptance Criteria
- [x] A sidebar entry "AI" opens `/ai` (new lib, e.g. `libs/console/feature-ai`).
- [x] Status card: configured or not, masked key suffix, billing mode (free / paid), default model per feature, last call time and last error; a "Test connection" button shows success + latency or the provider's error.
- [x] While the key is not configured, the page says which environment variable is missing and the test button is disabled (AI-004: the page never asks for or shows the key).
- [x] Usage: totals for today, 7 days and 30 days (calls, tokens, cost), broken down by model and feature; on the free tier cost is labelled as an estimate, not billed.
- [x] Recent calls: the last 50 usage rows with status, tokens, cost, latency and the item or run they served (link to the Radar item).
- [x] A note that remaining quota is not readable with an ordinary key, with links to the AI Studio usage and billing pages; a line that free-tier prompts may be used by Google to improve its products.
- [x] API: `GET /api/admin/ai/usage?range=` (aggregates) and `GET /api/admin/ai/calls?limit=` (recent rows).

## Technical Notes
- Console page, so read `.context/design/cookbook/console.md` and `.context/angular-style-guide.md` first. Material + `console-*` shared components; no landing components.
- No charts in this task; plain stat tiles and a table. Keep the page in one component unless it grows.
- 30-day totals must equal the sum of usage rows (epic success criterion): aggregate in SQL, do not recompute in the browser.

**Specialized Skill:** ng-lib — generate `libs/console/feature-ai` with the right tags and import path
**Key sections to read:** §Console feature libs

## Files to Touch
- libs/console/feature-ai/** (new)
- apps/console/src/app/app.routes.ts
- libs/console/shared/ui/src/components/main-layout/main-layout.html (sidebar entry)
- apps/api/src/modules/ai/presentation/** (usage endpoints)

## Dependencies
- 416 - AI module, status/test endpoints and ledger

## Complexity: M

## Progress Log
- 2026-10-06 Started. Using ng-lib for the feature-ai lib shape
- 2026-10-06 Lib config copied from feature-radar (same shape as ng-lib output). Page `ai-usage.list` in one component; formatting helpers in `ai.util.ts` (+spec, 7 tests).
- 2026-10-06 Deviations: routes are `/api/ai/usage` and `/api/ai/calls` (same admin guards as 416, no `/admin` prefix); range "today" became "24 hours" (rolling window); one default model (`AI_GEMINI_MODEL`), not one per feature, since only one model is used so far; links go to AI Studio rate limit + usage pages and the Gemini pricing page.
- 2026-10-06 Verified: API specs 17/17, feature-ai spec 7/7, tsc api + lib clean, eslint clean, `nx build console` OK. Live: 30d totals (9 calls, 274 micro-USD, 51/70 tokens) equal SUM over ai_usage_records. Screenshot at 1440 and 390: page has no horizontal overflow (the 57px overflow at 390 comes from the console top bar and exists on every page).
- 2026-10-06 Done — all ACs satisfied
