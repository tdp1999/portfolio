# Task: Radar — persist post images to Cloudinary

## Status: done

## Goal
Copy every image of a newly normalized item to Cloudinary right after capture, because Facebook CDN URLs expire within days.

## Context
Epic `epic-radar-ai-news` (Phase A). The Detail page and the LLM image notes depend on images that still load weeks later.

## Acceptance Criteria
- [x] When an item is created or its media list changes, the API downloads each image and uploads it to Cloudinary under a dedicated `radar/` folder.
- [x] Each media entry on the item records original URL, Cloudinary URL, and a status (`stored` or `failed`).
- [x] If an image download fails or times out after 15 seconds, then the API marks that image `failed`, keeps the item, and continues with the other images.
- [x] An image already stored is not uploaded again when the same post is re-captured.
- [x] The existing media cleanup job does not delete Radar images (verified by reading the job's selection logic and, if needed, excluding the `radar/` folder).
- [x] Upload of the images for a 50-post fixture finishes without holding all image buffers in memory at once (images processed one at a time or in small batches).

## Technical Notes
- Reuse `IStorageService.upload(buffer, options)` from `media/application/ports/storage.service.port.ts`; fetch with an `AbortSignal` timeout first.
- Decide (and record here) whether to create `Media` rows. Recommended: no `Media` rows, store the Cloudinary result on the item JSON, so Radar images never appear in the Media library or cleanup.
- Run as a follow-up after upload so a large upload request does not time out: the upload command creates items, then images are processed in batches (by the cron tick from 409 later; in Phase A trigger right after the upload completes, without blocking the response).

- **Decided 2026-10-04 (brief):** no `Media` rows; the Cloudinary result lives on the item media JSON (`storedUrl`, `storedExternalId`, `storageStatus`), so the media cleanup job (selects soft-deleted `Media` rows only; `findOrphans` is a stub) never sees Radar images and needs no change. Re-capture matches media by Facebook photo id, because the CDN URL is re-signed on every scrape. Shared-post images are stored too. `MediaModule` now exports `STORAGE_SERVICE`. Failed images are not retried automatically.

## Files to Touch
- apps/api/src/modules/radar/application/commands/persist-item-images.command.ts
- apps/api/src/modules/radar/radar.module.ts (import storage provider)
- apps/api/src/modules/media/application/jobs/media-cleanup.job.ts (only if exclusion needed)

## Dependencies
- 402 - items exist

## Complexity: M

## Progress Log
- 2026-10-04 Started. Using be-test for the merge + persist command tests
- 2026-10-04 Implemented: media JSON gains storedUrl/storedExternalId/storageStatus/storageError; `carryOverStoredMedia` keeps stored copies on re-capture (keyed by photo id); `PersistItemImagesCommand` (sequential, one buffer at a time, in-process running flag) fired without await after upload + `POST /radar/images/persist` to resume; `node:https` downloader with 15 s timeout, image content-type and 15 MB cap; uploads to `radar/`; item deleted mid-run → saveImages returns false and this pass's uploads are deleted.
- 2026-10-04 Local run (real FB CDN download, fake storage): 10 posts → 18/18 images stored in ~20 s, re-capture uploaded 0 and kept 18 stored, concurrent call returned alreadyRunning. Earlier runs proved the failure path: timed-out images marked `failed` with reason, the rest continued. Found and fixed: `fetch` stalls on IPv6 AAAA records here; Node's 250 ms happy-eyeballs window drops IPv4 on a trans-Pacific RTT, so the downloader uses `autoSelectFamilyAttemptTimeout` 1 s.
- 2026-10-04 Cleanup job verified by reading: `findExpiredSoftDeleted` selects soft-deleted `Media` rows only and `findOrphans` is a stub returning []; Radar creates no `Media` rows, so no change needed.
- 2026-10-04 Added (user decision, purge option A): `DELETE /radar/sources/:id` deletes every stored image first, then the source (cascade to runs + items). Any image delete failure → 502 `RADAR_IMAGE_DELETE_FAILED`, rows kept, safe to repeat (Cloudinary destroy of a missing file is a no-op). Orphan sweep (B) and retention (C) deferred: measured 1.8 images/post at ~45 KB → ~80 MB per 1,000 posts, under 0.1 of the free plan's 25 monthly credits.
- 2026-10-04 Tests (be-test, plan approved): carry-over x2, persist failure-continues, discard-on-deleted-item, delete-source keeps rows on failure then succeeds. Radar suite 11/11, api + console util tsc clean, lint clean.
- 2026-10-04 Done — all ACs satisfied

- 2026-10-04 Pre-commit review fixes: re-capture reports stored images it no longer contains and deletes them (orphans); image results are merged into the row under `FOR UPDATE` and only onto entries still `pending` with the same key, so a concurrent re-capture is never overwritten (`applyImageResults`); a persist call arriving mid-run sets `rerunRequested` so the run drains once more; upload command tests added; P2002 on source URL → 409 `RADAR_SOURCE_URL_TAKEN`; oversized author ids dropped; only http(s) links kept; non-raster types (SVG) rejected by an mime allowlist; deletes batched 5 at a time. Skipped: the shared Cloudinary adapter's generic "File upload failed" message (media module, real cause already logged). Real-DB rerun: re-capture mid-upload kept 18/18 stored, trimmed album deleted 1 orphan, delete source removed 17 files and 0 items left. Radar suite 17/17, tsc + lint clean.
