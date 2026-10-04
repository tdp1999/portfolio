# Task: Radar — Runs page (trigger and progress)

## Status: pending

## Goal
Let the Owner start a Hybrid run from the console and watch each step's progress until it is ready for `/radar work`.

## Context
Epic `epic-radar-ai-news` (Phase B). Replaces the manual Apify export plus upload for normal use.

## Acceptance Criteria
- [ ] A Runs page lists runs newest first with source, window, flow, status, item counts, and created time.
- [ ] A "New run" form takes source, window (default: since the last successful run, or 6 months), flow (default `HYBRID`) and item cap, and starts the run.
- [ ] While any run is active, the page polls every 10 seconds and updates per-step status; polling stops when no run is active or the page is left.
- [ ] When the analyze step is `AWAITING_EXTERNAL`, the page shows the instruction to run `/radar work`.
- [ ] If a step fails, then the page shows the step name and the provider's error message.

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
