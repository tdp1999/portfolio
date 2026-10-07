# Task: Console for AUTO runs (flow, budget, spend, sources)

## Status: done

## Goal
The Owner starts an `AUTO` run with a budget from the console, sees each run's AI spend, and reads an enrichment's sources on Detail.

## Context
From `epic-radar-phase-c`, split out of 418 (which does the API side). A flow says how much the Owner does by hand: `MANUAL` (upload + `/radar work`), `HYBRID` (`/radar work`), `AUTO` (only reads).

## Acceptance Criteria
- [x] Detail and Feed show the analysis depth (`analysisDepth`: quick vs deep, worker = full) and, for a deep-failed item, its `workError`; the Runs dialog shows the default budget ($1).
- [x] The New run dialog offers `AUTO` as the default flow when Gemini is configured, with a budget field (entered in the display currency, default from config); `AUTO` is disabled with the reason when `GEMINI_API_KEY` is missing.
- [x] The Runs page shows each run's AI spend (sum of its usage rows) next to its budget; on the free tier the spend is labelled as an estimate.
- [x] The Detail page's AI analysis section lists the enrichment's `sources` as links; nothing shows when there are none.
- [x] The flow labels and help text on the Runs page say what the Owner does in each flow.

## Technical Notes
- Console page: read `.context/design/cookbook/console.md` and `.context/angular-style-guide.md` first.
- No template method calls: computed row view models or pure pipes.

## Files to Touch
- libs/console/feature-radar/src/lib/radar-run.create.dialog/**
- libs/console/feature-radar/src/lib/radar-run.list/**
- libs/console/feature-radar/src/lib/radar-item.record/**
- libs/console/feature-radar/src/lib/radar.data.ts, radar.types.ts

## Dependencies
- 418 - AUTO flow, budget and spend in the API

## Complexity: M

## Progress Log
- 2026-10-07 Started. Owner added: show money in VND, with an optional settings page for the default currency and rate, and one shared currency primitive whose tooltip always shows the USD original.
- 2026-10-07 Decisions. Currency is display only: API and DB keep micro-USD. `CurrencyService` (console shared-ui) keeps `{ currency, vndPerUsd, rateUpdatedAt }` in localStorage like the theme; default VND at 26,000, rate input 1,000 to 100,000, optional "Fetch today's rate" from open.er-api.com (keyless, added to the console CSP). `<console-money [microUsd]>` renders the amount with a tooltip "$X USD" plus the rate. New page Settings → Currency (user menu). The AI page switched to `<console-money>`; `formatCost` moved to shared `formatUsd`. The run budget is entered in the display currency and converted to USD (cents, min $0.01) before `budgetUsd` is sent, so AC 2 now says display currency instead of USD.
- 2026-10-07 API: `GET /radar/ai/settings` (`configured`, `billing`, `defaultBudgetMicroUsd`); `RadarRunDto.spentMicroUsd` for AUTO runs from one grouped ledger sum (`IAiClient.spentByGroup`, `groupBy groupId`), null for other flows; Feed and Detail carry `workError`, `analysisDepth`, Detail `sources`. Segmented control options gained `disabled`.
- 2026-10-07 Console: New run dialog (AUTO default when configured, disabled with reason otherwise, flow help line, budget field), Runs page Spend column ("Estimate, free tier" on free billing) and flow tooltips, Feed depth caption and deep-error icon, Detail Depth property, quick-pass note, workError note and Sources list. Spec `run.queries.spec.ts` (one grouped call over AUTO ids, 0 without rows, null for other flows). Radar + AI 45 suites / 254 tests pass, currency util 13 pass, feature-ai pass, `nx build console` OK. Feature guide updated.
- 2026-10-07 Done: all ACs satisfied.
- 2026-10-07 Pre-commit review fixes: the New run dialog and Runs page no longer break when `/radar/ai/settings` fails (AUTO stays off, no estimate note); the budget field checks $0.01 to $100 in the display currency and shows the server's budget error inline; a hand-typed rate in Settings → Currency is saved with today's date, not the last fetch time.
