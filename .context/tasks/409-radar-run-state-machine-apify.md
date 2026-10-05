# Task: Radar — run state machine, cron tick and Apify capture adapter

## Status: done

## Goal
Let the API start an Apify job itself and drive a `RadarRun` through its steps on a cron tick, so the Hybrid flow needs no manual file handling.

## Context
Epic `epic-radar-ai-news` (Phase B). No queue: state lives in `RadarRun` / `RadarStepRun`, advanced in bounded batches. Runs start only when the Owner triggers them (RAD-006).

## Acceptance Criteria
- [x] `POST /radar/runs` (admin) creates a run for a source, window, flow (`MANUAL` or `HYBRID`) and item cap, with one step row per pipeline step.
- [x] Where the run's flow is `HYBRID`, the capture step starts the configured Apify actor through the Apify API and stores the job reference.
- [x] On each cron tick the API polls running capture jobs, and when a job succeeds it reads the dataset page by page and passes it to the normalizer from 402.
- [x] After capture and normalize finish, the run's image persistence (403) runs in batches, then the analyze step moves to `AWAITING_EXTERNAL`.
- [x] When every item of the run has an enrichment, the analyze step and the run move to `DONE`.
- [x] If the Apify job fails, times out, or returns more items than the cap, then the capture step and the run move to `FAILED` with the provider's message.
- [x] If no run is active, then the cron tick performs one cheap query and does nothing else.
- [x] Ticks never overlap: a tick that starts while the previous one still runs exits immediately.
- [x] The Apify token is read from env and never returned by any endpoint.
- [x] Where the run's flow is `MANUAL`, the capture step waits in `AWAITING_EXTERNAL` until the Owner uploads an export with that `runId`; the run then advances like a Hybrid run. An upload without `runId` keeps the Phase A behaviour.
- [x] The Radar feature guide (`.context/guides/radar-feature-guide.html`) documents the Manual and Hybrid flows, the run and step states, and the run endpoints.

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

- **Step mapping (decided 2026-10-05):** CAPTURE = start and poll the provider job (or wait for the upload); NORMALIZE = fetch the dataset page by page, normalize, upsert; ENRICH = image persistence in batches; ANALYZE = `ExternalWorker`, `AWAITING_EXTERNAL` until every run item is DONE. No SYNTHESIZE row: the brief (412) is window-based, not run-based.
- **Guardrails added at pickup:** one active run per source (409 Conflict), item cap at most 1,500, a 60-minute capture deadline on top of Apify's own TIMED-OUT, token sent in the `Authorization` header (never in a URL), Apify env vars optional so a deploy never depends on them.

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
- [2026-10-05] Started. Using be-test for the state machine specs. No migration needed: `RadarRun`/`RadarStepRun` already carry status, job ref and `meta`.
- [2026-10-05] Built: `CAPTURE_PROVIDER` port (`ICaptureProvider` start/poll/fetchPage, resolved per run by name) + `ApifyCaptureAdapter` (native fetch, 30 s timeout per call, token in the Authorization header only); `LLM_PROVIDER` port + `ExternalWorkerAdapter`. Deviation: `process({ step, runId })` instead of `process(step, items, profile)`, because the external worker never reads items or the profile; a Phase C server-side adapter loads them itself. `RadarRunRepository`, `saveCapturePage` (shares the upsert with `saveCapture`), `CreateRun` / `AdvanceRun` / `CancelRun` commands, `ListRuns` / `GetRun` queries, `RadarTickJob` (every minute, in-process overlap flag, idle = one `findActiveIds` query). `PersistItemImagesCommand` takes an optional `maxItems` (10 per tick). Upload accepts `runId` for a waiting Manual run. Env: `APIFY_TOKEN` (optional, Hybrid refused without it), `RADAR_APIFY_POSTS_ACTOR` (default `apify/facebook-posts-scraper`).
- [2026-10-05] Added at implementation: `POST /radar/runs/:id/cancel`. The one-active-run rule needs a way out: a Manual run nobody uploads to (or a run stuck on items) would block its source for good. Cancel fails the current step and the run with "Cancelled by the Owner"; a started Apify job is not aborted.
- [2026-10-05] Tests (be-test, 21 new): state machine 11, create 3, tick 2, upload with runId 2, Apify adapter 2, image limit 1. Radar suite 80/80, `tsc` app + spec clean.
- [2026-10-05] Live check on local API (Manual flow, no Apify cost): create MANUAL cap 2 -> AWAITING_EXTERNAL; second run on the same source -> 409; cap 5000 -> 400; upload 3 posts over cap 2 -> 400 nothing written; upload 2 posts with runId -> CAPTURE and NORMALIZE DONE, ENRICH RUNNING; about one minute later ENRICH DONE and ANALYZE + run AWAITING_EXTERNAL (local items unanalyzed); second upload into the same run -> 400 RUN_NOT_AWAITING_UPLOAD; GET /radar/runs has no job refs or tokens; cancel -> FAILED, cancel again -> 400, a new run is accepted afterwards.
- [2026-10-05] Guide updated: new section 7 "Runs: Manual và Hybrid" (flows, steps, states, failure causes, cancel, limits, two worked examples), endpoints, glossary, data model, error codes, decisions, gaps, roadmap.
- [2026-10-05] Open: AC 2, 3, 5, 6 are covered by unit tests but not yet seen on real data. They need one small live Hybrid run (cap about 10 posts, about $0.06 to $0.08 of Apify credit) with `APIFY_TOKEN` set, then one `/radar work` pass on those items. Waiting for the Owner's go-ahead on the cost.
- [2026-10-05] Live Hybrid run on local API with the Owner's Apify token (cap 10, no window, about $0.05): 13:43:57 created PENDING; 13:44:12 first tick started the Apify job (CAPTURE RUNNING, job ref stored); 13:45:12 job SUCCEEDED, CAPTURE and NORMALIZE DONE in the same tick, 10 captured / 10 created / 0 failed; 13:45:42 images copied, ENRICH DONE, ANALYZE and run AWAITING_EXTERNAL. One Sonnet worker ran `/radar work` against the local API (claimed 10, stored 10, rejected 0); the next tick at 13:48:00 moved ANALYZE and the run to DONE.
- [2026-10-05] AC 6 (Apify failure, timeout, over-cap) is verified by unit tests only (status mapping in the adapter spec, the three failure paths in the state machine spec). Not reproduced live: forcing a provider failure would spend credit and exercise no code beyond what the tests cover.
- [2026-10-05] Done: all ACs satisfied.

- [2026-10-05] Pre-commit review fixes:
  - Run and step writes are conditional on the run being active (`updateMany`), and `fail` returns false on a run already ended. A cancel that lands mid-tick is no longer overwritten, and the tick loop stops on the reloaded run. Cancel answers `RADAR_RUN_FINISHED` when the tick ended the run first.
  - `recordError` re-reads the step, so a NORMALIZE error keeps the offset saved earlier in the same tick.
  - The NORMALIZE offset advances by the page size, not by the rows returned (`clean=true` pages can be short).
  - ANALYZE counts only items the worker can still claim: stuck items and items of a paused source no longer hold a run open.
  - Run creation checks for an active run inside a transaction that locks the source row. A direct upload (no `runId`) is refused with 409 while the source has an active run. A Manual run's upload flips its steps in one transaction (`completeUpload`) that re-checks the run.
  - `PersistItemImagesCommand`: a bounded caller (the tick) no longer drains a backlog requested mid-run; that rerun goes on in the background.
  - A provider job whose reference could not be saved is named in the log.
  - `step.error` is cleared when a step finishes.
  - Tests: `run.cancel.command.spec.ts` and `radar-run.repository.integration.spec.ts` (Postgres: concurrent create, writes on a cancelled run, single upload completion, analyze count). The API radar suite passes 94/94.
