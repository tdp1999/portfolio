# Task: Radar — Phase A acceptance run on production

## Status: done

## Goal
Run the Manual flow end to end on Railway with 6 months of real posts, so the Owner can start reading.

## Context
Epic `epic-radar-ai-news` (Phase A checkpoint). Testing on this epic is deliberately light; this real run is the main oracle. Must finish before the laptop return.

## Acceptance Criteria
- [x] Railway variables `RADAR_WORKER_TOKEN_HASH` is set for "Dashboard API" (set by the Owner; value never shown in chat).
- [x] The Owner exports 6 months of `facebook.com/mrgoonie` posts from Apify and uploads it through the console.
- [x] The Feed shows every post in the export exactly once (count in Feed equals unique ids in the file).
- [x] Uploading the same file a second time creates zero new items.
- [x] After the capture and worker fixes are deployed and the export is re-uploaded, one more `/radar work` round (4 parallel workers x 30 items) stores every claimed item with no rejection. The rest of the queue is not required for this task: it drains in later sessions.
- [x] Images on 5 randomly picked items load from Cloudinary.
- [x] If any step fails during the run, then the failure and its fix are recorded in this task's Progress Log before closing.
- [x] Console and API builds pass (`nx build console`, `nx build api`), one at a time after a RAM check.

## Technical Notes
- Apify cost check: record actual items and dollars spent.
- Worker sessions: run in batches; note how many items one Claude Code session handles, to size future runs.

## Files to Touch
- (none expected; fixes go back to the owning task)

## Dependencies
- 403, 405, 406, 407

## Complexity: S

## Progress Log
- 2026-10-05 Started. Prod is on 6c955873: Dashboard API deploy SUCCESS (Railway), console on Cloudflare Pages serves the Radar route, post-deploy smoke test green. Backfill input agreed: `startUrls` mrgoonie, `resultsLimit: 1100`, `captionText: false`, no date filter (~$5.5).
- 2026-10-05 Worker preflight `radar-api.sh check` against https://dashboard-api.thunderphong.com/api returns ok, so `RADAR_WORKER_TOKEN_HASH` on Dashboard API matches the local worker token. Apify run `m55059pdSYrLFV8cm` started 09:00 UTC (dataset `mCo9A7DiQo2WQbi81`), 210 items after ~2.5 min, 0 failed requests.
- 2026-10-05 Apify run `m55059pdSYrLFV8cm` aborted on purpose at 09:15 UTC once it passed the 6-month mark: 900 items, 2026-03-11 to 2026-10-05 (~7 months, ~130 posts per month), 0 failed requests, ~14.5 min runtime. Cost ~$4.50 (900 x $0.005 + $0.001 start).
- 2026-10-05 Export `dataset_facebook-posts-scraper_2026-10-05_09-15-22-783.json`: 900 rows, 900 unique `postId`, 0 null ids. Console upload result: 892 new + 8 updated = 900. The 8 updates are posts already in prod from earlier test uploads (expected), so every post in the file landed exactly once.
- 2026-10-05 Re-upload of the same file: 0 new, 900 updated. Feed total reads 902: the 900 from the file plus 2 older test items that are not in this export. 899 pending (3 were enriched in the earlier `/radar work --limit 3` smoke run).
- 2026-10-05 Owner spot-check found 4 UI issues on prod (not blockers for this run): (1) the Detail page links to the original post up to 4 times (header button, "Open on Facebook" property, "Open shared post", shared-post entry in Links); (2) a shared post's media (e.g. the shared post's video) shows in the post's own "Images" section; (3) images open a new tab instead of a lightbox; (4) the "N pending" badge sits on its own row under the description, wanted next to the title or as a status filter with per-status counts.
- 2026-10-05 The 4 UI issues are fixed locally (uncommitted, part of the Radar feature from task 407). (1) Detail links to Facebook at most twice: the header "Original post" button, plus "Open shared post" for shared posts. The "Original post" property and shared-post entries in Links are removed. (2) A shared post's media renders inside its "Shared from" block, and the Images section shows only the post's own media. Videos are a thumbnail tile with "Watch on Facebook". (3) Photos open a `QuickLook` lightbox (←/→, Esc), and tiles use `object-fit: contain`. (4) The queue badges sit next to the "Radar" title, and a new Status filter (`?status=pending|analyzed|stuck|paused`, API `status` param, same buckets as the stats call) lists each status with its count. Verified on local with Playwright (no horizontal overflow). API specs and feature-radar tests pass, and `nx build console` + `nx build api` are green.
- 2026-10-05 Radar filter bar narrowed on the Radar page only (selects 148px, Min score 176px for "7+ worth reading", search min 240px). All filters and "Show promo" fit one row from 1440 up, with no label clipped. At 1280, "Show promo" still wraps.
- 2026-10-05 First analysis pass: 4 parallel Sonnet workers (`/radar work --batch 10 --limit 30` each), 120 items stored in 12 batches. 0 rejected, 1 self-resubmit (a worker misread an image), no claim collisions (123 claimed ids, all unique). About 394k subagent tokens in total, about 3-4 min per worker. About 780 items remain pending.
- 2026-10-05 Cloudinary check: 5 random items (seed 408) each return 200 image/jpeg from `res.cloudinary.com/thunderphong-portfolio`. Over all 123 claimed items, 139 of 153 image URLs are on Cloudinary. 14 images on 10 items (2026-09-10 to 09-29) were never stored and still point at expired `fbcdn.net` URLs, so the worker could not download 12 of them. **Open:** find out why upload-time persistence skipped them, then decide on a re-capture or a fix.
- 2026-10-05 Worker feedback for the guide and script: (a) the `images` output does not map files to items or to own vs shared images; (b) there is no rule for REEL or VIDEO items whose content is the video (workers scored them low and noted it in `imageNotes`); (c) many posts say "link in comments", but comments are not captured; (d) `ocrText` is mostly "May be an image of text"; (e) there is no skip-count summary.
- 2026-10-05 AC changed with the Owner: Phase A acceptance needs only one clean worker round after the fixes, not the whole queue (about 780 items).
- 2026-10-05 Root cause of the 14 unstored images: the Apify actor returned some image URLs on ISP-embedded edge hosts (`scontent.fosu2-1/2`, `scontent.ftpa1-1` `.fna.fbcdn.net`). These do not resolve in public DNS, so the API's image persistence and the worker both failed with a DNS error. The signed path is host-independent: all 14 URLs return 200 image/jpeg on `scontent.xx.fbcdn.net`. Fix: the normalizer rewrites `scontent.<edge>.fna.fbcdn.net` to `scontent.xx.fbcdn.net`. A re-upload turns failed images back to `pending`, so persistence retries them. The signed URLs expire 2026-10-09, so the re-upload must happen before then.
- 2026-10-05 Shared-post fix (Owner report, item `01a10b5b-9d90-753e-a6a3-e7a996f818f2`): on 12 of the 172 shares the actor puts the shared post's media under `sharedPost.attachments`, not `sharedPost.media`, so it was dropped (this item lost a photo and a video). It also copies the shared post's `link` (here a `#bipvn_share` hashtag) to the top level, where it showed as the post's own link. Fixes: the normalizer reads `media` and `attachments` (deduplicated by id); it drops `facebook.com/hashtag/` links; a top-level link equal to the shared post's link gets origin `shared-post`. Detail Links now shows every link except the shared permalink, with a "From shared post" badge. Over the full export: 900 items, 0 failures, 1217 media, 0 edge-host URLs, 278 shared-post media.
- 2026-10-05 Worker kit: `radar-api.sh images` names files `<itemId>-<own|shared>-<n>.<ext>` and prints an `images: N saved, M skipped` count. The enrichment guide gains a "Gaps in the captured data" section covering reels and videos (score at most 4 unless the text carries the news), "link in the comments", generic `ocrText`, and off-topic posts.
- 2026-10-05 The Owner's re-upload ran on the old prod build (the fixes above were not committed or deployed yet), so it changed nothing. It must be repeated after the deploy, before 2026-10-09.
- 2026-10-05 Owner review: enrichments are too thin (item `01a10b5b-9d90-753e-a6a3-c8cd2e8aae77`: no background, no reason for the score, `applyNote` null). Owner chose "add fields + research". Enrichment schema v2: new required `context` (background from WebSearch: what each named tool or model is, price, alternatives) and `scoreReason` (why this score, type and relevance); `applyNote` is now required (one line for promo and off-topic posts). DB: nullable `context` and `scoreReason` columns (v1 rows stay readable), plus a data step that re-queues every item with a v1 enrichment so the next round re-analyzes it. Detail shows a "Context" section (Background, Why this score). The worker loop gains a Research step, and the guide gains Research and Example sections.
- 2026-10-05 Deploy `5d38722a` on Railway: migration `radar_enrichment_v2` applied. The Owner re-uploaded the export on the new build, and the API logged "Radar images: 84 stored, 0 failed" (the 14 edge-host images and the newly read shared-post attachments).
- 2026-10-05 v2 round: 4 Sonnet workers (`--batch 5 --limit 30`), 120 items stored in 24 batches, 0 rejected, 120 unique claims. About 70 WebSearch and 4 WebFetch calls, about 523k subagent tokens, 6-11 min per worker. All 151 claimed image URLs are on Cloudinary, none on fbcdn. Share item `…e7a996f818f2` now has its shared photo and video, and only the shared permalink as its link. All 10 items that lost images earlier now have them. Item `…c8cd2e8aae77` (Seedance) has v2 `context` (Seedance 2.5 and Eleven v4 with prices), `scoreReason`, a non-null `applyNote`, and a `factCheck` that checks the $16.2 claim against provider prices.
- 2026-10-05 Notes, not blockers: (a) workers logged 10 image download failures, and on my retry 7 of the 151 Cloudinary URLs gave transient TLS errors from this machine (`curl: (35)`), with a different set on each run, so this is local network flakiness, not missing files; (b) worker 2 saw about 6 transient connection resets on claim or submit (a plain retry worked), so `radar-api.sh` could use retry with backoff; (c) one worker skipped research on a few low-value posts. About 780 items stay pending for later sessions.
- 2026-10-05 Done: all ACs satisfied.
