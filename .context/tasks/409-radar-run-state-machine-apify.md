# Task: Radar — run state machine, cron tick and Apify capture adapter

## Status: pending

## Goal
Let the API start an Apify job itself and drive a `RadarRun` through its steps on a cron tick, so the Hybrid flow needs no manual file handling.

## Context
Epic `epic-radar-ai-news` (Phase B). No queue: state lives in `RadarRun` / `RadarStepRun`, advanced in bounded batches. Runs start only when the Owner triggers them (RAD-006).

## Acceptance Criteria
- [ ] `POST /radar/runs` (admin) creates a run for a source, window, flow (`MANUAL` or `HYBRID`) and item cap, with one step row per pipeline step.
- [ ] Where the run's flow is `HYBRID`, the capture step starts the configured Apify actor through the Apify API and stores the job reference.
- [ ] On each cron tick the API polls running capture jobs, and when a job succeeds it reads the dataset page by page and passes it to the normalizer from 402.
- [ ] After capture and normalize finish, the run's image persistence (403) runs in batches, then the analyze step moves to `AWAITING_EXTERNAL`.
- [ ] When every item of the run has an enrichment, the analyze step and the run move to `DONE`.
- [ ] If the Apify job fails, times out, or returns more items than the cap, then the capture step and the run move to `FAILED` with the provider's message.
- [ ] If no run is active, then the cron tick performs one cheap query and does nothing else.
- [ ] Ticks never overlap: a tick that starts while the previous one still runs exits immediately.
- [ ] The Apify token is read from env and never returned by any endpoint.

## Technical Notes
- Apify REST: start actor run, get run status, list dataset items with `offset/limit`. Native `fetch` with `AbortSignal` timeout; no SDK.
- Env: `APIFY_TOKEN`, `RADAR_APIFY_POSTS_ACTOR` (from 400's decision).
- Template for the job: `media/application/jobs/media-cleanup.job.ts` dispatching through `CommandBus`.
- Overlap guard: a DB advisory lock or an in-process flag (single API instance today).
- Memory: never load the whole dataset; Railway memory cost task 387.

**Specialized Skill:** be-test — tests the state transitions and failure paths only
**Key sections to read:** logic vs non-logic triage

- **Carried over from 402 (decided 2026-10-04):** 402 shipped only the format normalizer (`ICaptureNormalizer`, token `CAPTURE_NORMALIZERS`, `ApifyFacebookNormalizer`) and `IRadarCaptureRepository.saveCapture` (MANUAL runs only). This task defines the `CAPTURE_PROVIDER` start/poll/fetch port, reuses the normalizer on the fetched dataset, and generalises `saveCapture` for runs that already exist (HYBRID).
- **Carried over from 404 (decided 2026-10-05):** 404 shipped only the worker HTTP API (claim/results/profile). This task defines the `LLM_PROVIDER` port (`process(step, items, profile)`, resolved per run by adapter name) and the `ExternalWorker` adapter that parks the analyze step in `AWAITING_EXTERNAL`; the worker endpoints from 404 stay the way that work gets done.

## Files to Touch
- apps/api/src/modules/radar/infrastructure/capture/apify-capture.adapter.ts
- apps/api/src/modules/radar/application/jobs/radar-tick.job.ts
- apps/api/src/modules/radar/application/commands/run.create.command.ts
- apps/api/src/modules/radar/application/commands/run.advance.command.ts (+ .spec.ts)
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- apps/api/src/modules/radar/application/ports/llm-provider.port.ts
- apps/api/src/modules/radar/infrastructure/llm/external-worker.adapter.ts

## Dependencies
- 402, 403, 404
- 408 recommended first (Phase A in use)

## Complexity: L

## Progress Log
