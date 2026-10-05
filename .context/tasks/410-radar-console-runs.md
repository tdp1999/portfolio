# Task: Radar — Runs page (trigger and progress)

## Status: done

## Goal
Let the Owner start a Hybrid run from the console and watch each step's progress until it is ready for `/radar work`.

## Context
Epic `epic-radar-ai-news` (Phase B). Replaces the manual Apify export plus upload for normal use.

## Acceptance Criteria
- [x] A Runs page lists runs newest first with source, window, flow, status, item counts, and created time.
- [x] A "New run" form takes source, window (default: since the last successful run, or 6 months), flow (default `HYBRID`) and item cap, and starts the run.
- [x] While any run is active, the page polls every 10 seconds and updates per-step status; polling stops when no run is active or the page is left.
- [x] When the analyze step is `AWAITING_EXTERNAL`, the page shows the instruction to run `/radar work`.
- [x] If a step fails, then the page shows the step name and the provider's error message.
- [x] While any run is active, the Feed header shows a small "1 run in progress" badge next to the queue status that links to the Runs page; it reads `GET /radar/runs`, no new endpoint (agreed 2026-10-05).
- [x] An active run has a "Cancel" action (`POST /radar/runs/:id/cancel`, task 409) with a confirm dialog; a Manual run that waits for its upload has an "Upload export" action that sends the file with its `runId`.

## Technical Notes
- Polling with `interval` + `takeUntilDestroyed`, or a signal-based effect; follow `.context/angular-style-guide.md`.
- Step progress fits `console-record-*` or a simple stepper; check shared UI first.

## Files to Touch
- libs/console/feature-radar/src/lib/radar.runs/**
- libs/console/feature-radar/src/lib/radar.routes.ts
- libs/console/feature-radar/src/lib/radar.service.ts

## Dependencies
- 409 - run endpoints
- 406 - feature lib

## Complexity: M

## Progress Log
- 2026-10-05 Started. Files follow the naming grammar: `radar-run.list/` (page) and `radar-run.create-dialog/` (form) instead of `radar.runs/`. The default window is computed client-side from `GET /radar/runs` (no new endpoint).
- 2026-10-05 Runs page, New run dialog, Feed badge, Cancel and Upload export done. Polling uses `interval` + `takeUntilDestroyed` and runs only while a run is active; background polls and the badge read silently (`SKIP_ERROR_HANDLING`), so a failed poll raises no toast.
- 2026-10-05 Owner feedback: no template method calls. feature-radar now uses computed signals, a `rows()` view model, and pipes (shared `enumLabel`, plus new `radarScoreTone`, `urlHost` and `radarImageViewable`). The sweep of the other 26 FE templates is a separate change.
- 2026-10-05 Cancelled runs show "Cancelled" (muted) instead of "Failed". The shared constant `RADAR_RUN_CANCELLED_MESSAGE` is used by the API cancel command and by the console. `RADAR_MAX_RUN_ITEM_CAP` moved to shared types.
- 2026-10-05 Verified headed on local (:4300 and :3000):
  - list, empty-step legacy rows and failed notices render;
  - a New run (Manual, cap 5) and an Upload export of 3 posts with `runId` both worked;
  - the page polled 4 times until the `/radar work` notice appeared, the Feed badge "1 run in progress" linked to Runs, and Cancel with its confirm dialog worked;
  - polling stopped once no run was active (0 requests in 12 s). No console errors.
  - Not exercised live: a Hybrid run from the UI (costs Apify credits; the same endpoint was verified in 409).
- 2026-10-05 Guide updated: global flow rebuilt around runs, a "Trang Runs trong console" section, 410 decisions, and roadmap 410 Xong.
- 2026-10-05 Done. All ACs satisfied.
- 2026-10-05 Pre-commit review fixes:
  - `onNewRun` and `onCancel` use one pipeline each (`switchMap`, `filter`, `finalize`) instead of nested subscribes.
  - Window bounds are whole UTC days, matching Apify's `YYYY-MM-DD` filter. The default start is the day after the last DONE run's end, never after today, so the start date can no longer equal the end date (the old 400).
  - The Feed's "runs in progress" badge sits outside the stats block, so a failed stats call no longer hides it.
  - Dead `hostOf` removed from Detail.
  - feature-radar passes 20/20, and `nx build console` passes.
