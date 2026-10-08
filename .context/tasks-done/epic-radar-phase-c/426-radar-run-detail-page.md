# Task: Run detail page

## Status: done

## Goal
The Owner opens one run from the Runs page and sees what was asked, what each step did, which posts came out of it, why posts failed and what the AI spent.

## Context
Asked by the Owner on 2026-10-07, after a run for 6/10 showed "Captured 1", "Failed 1" and status DONE with no way to tell which post was captured or why it failed. The cause was an empty Apify window (fixed in task 421: the actor's upper bound is now the next day, and a provider notice such as "Apify found no posts" lands on `radar_runs.warning`). The Runs table still only shows counts.

Facts that shape the design:
- `GET /radar/runs/:id` already exists and returns `RadarRunDto` (steps with status, adapter, error and times; counts; warning; error; budget and spend). There is no console route for it.
- The Apify input sent is not stored. `radar_step_runs.meta` (JSONB) and `providerJobRef` exist per step and are the natural place for it.
- Items link to a run through `radar_items.lastRunId` only, so a later run that captures the same post again takes it over. "Posts of this run" therefore means "posts whose last run is this one", and the page says so.
- Failed posts are only counted (`itemsFailed`). The reasons are thrown away after NORMALIZE except the first one, which goes into `warning`.
- AI calls of a run carry `ai_usage_records.groupType = RADAR_RUN_AI_GROUP` and `groupId = runId` (set in `server-ai.adapter.ts`) and `feature` (`radar.analysis.*`, `radar.transcript`), so spend per feature is one grouped query.
- Task 425 adds `REANALYZE` runs with no source and only the ANALYZE step; the page must not assume a source or a CAPTURE step.

## Acceptance Criteria
- [x] Route `/radar/runs/:id` in the console, reached by clicking a row of the Runs table (and from the run link in the Feed or Detail, where one exists). An unknown id shows the standard not-found state.
- [x] Header: source (or "Re-analysis" for a run with no source), flow, status, window shown as UTC days, item cap, budget and spend, created/started/finished times, and the run's `error` and `warning` in full.
- [x] Capture request: the input sent to the provider (source URL, `onlyPostsNewerThan`, `onlyPostsOlderThan`, results limit, comments on or off) is stored on the CAPTURE step's `meta` when the job starts and shown on the page with the provider job reference. Older runs without it show "Not recorded for this run".
- [x] Step timeline: one row per step with status, adapter, duration and error; a skipped or never-reached step reads as such.
- [x] Failed posts: NORMALIZE stores up to 20 failures per run (post id or URL when known, and the reason) on the NORMALIZE step's `meta`, and the page lists them. When more failed, a line says how many were not kept.
- [x] Posts of this run: a list of items whose `lastRunId` is this run (author, published date, kind with the video icon, work status, score), each linking to the item Detail page, with one line explaining that a later run of the same source can take a post over.
- [x] AI spend for AUTO runs: total plus a row per `feature` (calls, tokens, cost), from the usage ledger grouped by this run. HYBRID runs show none.
- [x] A failure path: a run whose CAPTURE step failed shows the step error and an empty posts list without breaking the page.
- [x] Specs: the NORMALIZE failure cap (20 kept, the rest counted), the capture input written to step meta, and the run detail query (posts by `lastRunId`, spend grouped by feature, a run with no source). Feature guide updated (Runs page row click, the run detail page and what each block means).

## Technical Notes
- The Auto re-analysis toast (task 425) links to `/radar/runs` via `REANALYZE_RUN_LINK` in `radar.data.ts`; once the run detail page exists, point it at `/radar/runs/<runId>`.
- Extend `RadarRunDto` for the detail endpoint only (a `RadarRunDetailDto` with `captureInput`, `failures`, `aiSpend`), keep the Runs list payload as it is. Posts come from the items endpoint filtered by `runId` (add the filter) so the list reuses the Feed's paging, not a second item shape.
- Read pages follow the record view (`console-record-layout`, ADR-026, `.context/design/patterns/record-detail-layout.md`): scalar facts in the property rail, the request, timeline, failures and posts as sections in the column.
- Dates: windows are UTC days (`date: 'mediumDate' : 'UTC'`); timestamps in local time as on the Runs page.
- Step times: today every step a tick finishes gets the tick's start time as `finishedAt` (seen on run `01a115d6`: NORMALIZE, ENRICH and ANALYZE all at 10:10:00.012 while the transcript calls ran until 10:10:37). Stamp each step when it actually starts and ends, or the timeline durations are wrong.
- Failure reasons are short strings already produced by the normalizer; trim each to 300 characters.

**Specialized Skill:** be-test — failure cap, capture input in meta, run detail query
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/application/commands/run.advance.command.ts (store failures, capture input)
- apps/api/src/modules/radar/infrastructure/capture/apify-capture.adapter.ts (return the input it sent)
- apps/api/src/modules/radar/application/queries/ (run detail query, items `runId` filter)
- apps/api/src/modules/radar/application/radar.dto.ts, radar.presenter.ts
- libs/console/feature-radar/src/lib/radar-run.detail/ (new), radar.routes.ts, radar-run.list/
- .context/guides/radar-feature-guide.html

## Dependencies
- 421 - run window fix and provider notices
- 425 - REANALYZE runs (soft: if 425 lands first, cover a run with no source; if not, keep the page free of that assumption)

## Complexity: M

## Progress Log
- 2026-10-08 Backend: capture providers return `{ jobRef, input }`, stored on CAPTURE `meta.input`; NORMALIZE (tick and manual upload) keeps up to 20 failures with ref and a 300-char reason (`RadarRunFailureLog`); steps stamped by a per-tick clock; `GET /radar/runs/:id` returns `RadarRunDetailDto` (`captureInput`, `captureJobRef`, `failures`, `aiSpend` from `IAiClient.spendByFeature`); items list takes `runId`; item detail carries `lastRunId`.
- 2026-10-08 Console: `radar-run.detail` page (record layout, polls while active), `runs/:id` route, Runs row click, item Detail "Run" property, re-analysis toast links to the run. Feature guide `#run-detail` added. UI not visually verified yet (needs a console restart for the new route).
- 2026-10-08 Specs (11 new): failure log cap and trim, capture input kept through completeCapture, NORMALIZE failures on step meta, real step end times, GetRunHandler (AUTO spend per feature, Hybrid skips the ledger, re-analysis with no source), items list by runId (integration), YouTube failure ref, console runStepRows and formatDuration. 334 API unit tests, 13 integration, 10 console util tests pass; `nx build console` clean.
- 2026-10-08 Done — all ACs satisfied. UI still not visually verified (console restart needed for the new route).

