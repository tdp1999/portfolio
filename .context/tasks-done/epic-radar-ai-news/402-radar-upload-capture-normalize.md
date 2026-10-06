# Task: Radar — API module, capture port, JSON upload and Apify normalizer

## Status: done

## Goal
Create the `radar` API module with sources, the `CAPTURE_PROVIDER` port, the upload capture adapter and the Apify normalizer, so an uploaded export becomes deduped `RadarItem` rows.

## Context
Epic `epic-radar-ai-news` (Phase A). This is the Manual flow's capture step and the base the Hybrid flow reuses in 409. Follows the media `STORAGE_SERVICE` port/adapter pattern.

## Acceptance Criteria
- [x] Admin endpoints create, list and deactivate a `RadarSource` (platform, URL, display name).
- [x] When the Owner uploads an Apify posts JSON file for a source, the API creates one `RadarItem` per post whose `externalId` is new for that source.
- [x] If an uploaded post's `externalId` already exists for that source, then the API refreshes text, engagement and media and does not create a second item (RAD-001).
- [x] If the file fails schema validation, then the API responds 400 with field-level errors and creates no items (the whole upload runs in one transaction).
- [x] Every created item stores the provider's raw payload unchanged.
- [x] The upload response returns counts: created, updated, skipped, failed.
- [x] Post text is stored in its source language without any transformation other than trimming (RAD-002).
- [x] New items start in work status pending for the analyze step.
- [x] The normalizer has unit tests against the fixture from 400: field mapping, dedupe, and one malformed post.

## Technical Notes
- Module layout like `contact-message/`: `presentation/ application/{commands,queries,ports} domain/ infrastructure/{capture,repositories,mapper}`.
- Port shape (job model): `start / poll / fetch / normalize`. The upload adapter completes on the first poll. Resolve adapters by name at call time (per run), unlike media which resolves once at boot.
- Upload limit: set an explicit body size limit for the upload route (6 months of posts can be several MB).
- Controllers are thin; validation via Zod inside commands; responses via a presenter. Guards `JwtAccessGuard` + `RoleGuard` like `media.controller.ts:34`.
- Register the module in `apps/api/src/app/app.module.ts`.
- **Decided 2026-10-04 (brief):** no `CAPTURE_PROVIDER` job port here. 402 ships a format normalizer behind `CAPTURE_NORMALIZERS`; the start/poll/fetch port is defined in 409 when Apify is real. Upload is multipart (`FileInterceptor`, 30 MB), because the global JSON body limit is 100 KB and 6 months is ~14 MB. File-level problems (not JSON, not an array, empty, >5000) → 400; per-post problems (missing postId/url/time) → `failed` with index + reason; duplicate postId inside one file → `skipped`. Each upload records a `RadarRun` (flow MANUAL, status DONE, captureAdapter `upload`) and sets `lastRunId`. Re-capture refreshes content + rawPayload but never resets `workStatus`.

**Specialized Skill:** be-test — decides which pieces carry real logic (normalizer, dedupe) and writes only those tests
**Key sections to read:** logic vs non-logic triage

## Files to Touch
- apps/api/src/modules/radar/radar.module.ts
- apps/api/src/modules/radar/radar.token.ts
- apps/api/src/modules/radar/application/ports/capture-provider.port.ts
- apps/api/src/modules/radar/application/commands/upload-capture.command.ts
- apps/api/src/modules/radar/application/commands/source.*.command.ts
- apps/api/src/modules/radar/application/queries/source.list.query.ts
- apps/api/src/modules/radar/infrastructure/capture/upload-capture.adapter.ts
- apps/api/src/modules/radar/infrastructure/capture/apify-facebook.normalizer.ts (+ .spec.ts)
- apps/api/src/modules/radar/infrastructure/repositories/*.ts
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- apps/api/src/app/app.module.ts

## Dependencies
- 400 - fixture and confirmed field shape
- 401 - tables

## Complexity: L

## Progress Log
- 2026-10-04 Started. Using be-test for the normalizer spec (6 tests, plan approved)
- 2026-10-04 Normalizer + spec (6 tests, green against the 400 fixture). Module, source CRUD (create / list / activate / deactivate), multipart upload, `RadarErrorCode` + console dictionary entries, module registered in app.module. `tsc` clean for api app + spec and console util.
- 2026-10-04 Verified end to end on the local DB with a throwaway supertest spec (deleted after): source create 201, duplicate URL 409; non-array file 400 with field errors and 0 items; non-JSON 400; upload of 10 posts + 1 broken + 1 repeat → created 10 / skipped 1 / failed 1 (index 10, postId); all new items PENDING; re-upload with edited text → updated 10, text trimmed, likes refreshed, workStatus kept, lastRunId moved; rawPayload deep-equal to the fixture; Vietnamese text intact; 2 MANUAL/DONE runs with counts; upload to an inactive source 400. Test rows removed.
- 2026-10-04 Done — all ACs satisfied
