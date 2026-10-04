# Task: Radar — persist post images to Cloudinary

## Status: pending

## Goal
Copy every image of a newly normalized item to Cloudinary right after capture, because Facebook CDN URLs expire within days.

## Context
Epic `epic-radar-ai-news` (Phase A). The Detail page and the LLM image notes depend on images that still load weeks later.

## Acceptance Criteria
- [ ] When an item is created or its media list changes, the API downloads each image and uploads it to Cloudinary under a dedicated `radar/` folder.
- [ ] Each media entry on the item records original URL, Cloudinary URL, and a status (`stored` or `failed`).
- [ ] If an image download fails or times out after 15 seconds, then the API marks that image `failed`, keeps the item, and continues with the other images.
- [ ] An image already stored is not uploaded again when the same post is re-captured.
- [ ] The existing media cleanup job does not delete Radar images (verified by reading the job's selection logic and, if needed, excluding the `radar/` folder).
- [ ] Upload of the images for a 50-post fixture finishes without holding all image buffers in memory at once (images processed one at a time or in small batches).

## Technical Notes
- Reuse `IStorageService.upload(buffer, options)` from `media/application/ports/storage.service.port.ts`; fetch with an `AbortSignal` timeout first.
- Decide (and record here) whether to create `Media` rows. Recommended: no `Media` rows, store the Cloudinary result on the item JSON, so Radar images never appear in the Media library or cleanup.
- Run as a follow-up after upload so a large upload request does not time out: the upload command creates items, then images are processed in batches (by the cron tick from 409 later; in Phase A trigger right after the upload completes, without blocking the response).

## Files to Touch
- apps/api/src/modules/radar/application/commands/persist-item-images.command.ts
- apps/api/src/modules/radar/radar.module.ts (import storage provider)
- apps/api/src/modules/media/application/jobs/media-cleanup.job.ts (only if exclusion needed)

## Dependencies
- 402 - items exist

## Complexity: M

## Progress Log
