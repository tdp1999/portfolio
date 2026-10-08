# Task: Video transcripts before analysis

## Status: done

## Goal
Video items (YouTube videos, Facebook reels) get a transcript that the analysis reads.

## Context
From `epic-radar-phase-c`. In the last worker run, 3 of 23 posts were reels whose content could not be seen. Gemini reads public YouTube URLs directly and accepts uploaded video files.

## Acceptance Criteria
- [x] `RadarItem` gains transcript text, transcript status (`NONE | PENDING | DONE | FAILED`), failure reason and video duration.
- [x] In an `AUTO` run, a video item without a transcript gets one before its analysis; the transcript goes into the analysis request (and into the worker claim payload, so Claude Code can use it too).
- [x] YouTube: the public URL is passed to Gemini as a file part. Reels: the video URL from the capture payload is downloaded and uploaded to Gemini right after capture, before it expires.
- [x] Before the call, the cost estimated from the duration is checked against the run budget; a video longer than the source's maximum length is skipped with a reason.
- [x] If a transcript fails (private, too long, expired URL, provider limit), status is `FAILED` with the reason and the item is still analyzed from text and images (RAD-008).
- [x] The Detail page shows the transcript in a fold under the post.

## Technical Notes
- Use a Flash model for transcripts (cheap); usage feature `radar.transcript`.
- Video tokens: about 258 per frame at 1 fps plus audio; a lower media resolution setting cuts this a lot, prefer it.
- Free tier limits YouTube video length per day; a 429 or quota error keeps the item pending.

**Specialized Skill:** prisma-migrate — transcript columns
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — duration estimate vs budget, over-length skip, failure falls back to analysis
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/application/** (transcript step in run advance)
- apps/api/src/modules/radar/infrastructure/llm/gemini-transcript.adapter.ts (new)
- apps/api/prisma/schema.prisma + migration
- libs/console/feature-radar/src/lib/radar-item.record/**

## Dependencies
- 418 - AUTO flow and Gemini adapter

## Complexity: M

## Progress Log
- [2026-10-07] Started. Decisions with the Owner:
  - YouTube branch (public URL as a file part) is built and unit-tested here; it is checked live in 422, which adds YouTube items.
  - The maximum video length is one env setting, `RADAR_TRANSCRIPT_MAX_SECONDS` (default 600), not a per-source column.
  - Reels: the SD file is downloaded during ENRICH and sent inline. Up to 3 videos per tick, one after another, so only one file is in memory; the download stops past 20 MB, nothing is written to disk or DB except the text, and the buffer is dropped after the call.
  - The transcript is JSON with three parts: `spoken` (null when nobody talks), `onScreenText`, `visualSummary`, so a silent video still gets a useful result.
  - Extra column `transcriptAttempts`: a 429 keeps the item PENDING for up to 3 tries, then FAILED, so ENRICH never waits forever (RAD-008). The daily cap or the run budget fails it at once.
- [2026-10-07] Code done (API + console), docs updated (feature guide "Transcript video (AUTO)", domain.md Transcript + changelog, worker enrichment guide). Unit specs 280/280 pass, `nx build console` passes. Outstanding: the Owner creates and applies the migration (integration specs fail until the columns exist), the be-test plan needs approval, and the Detail fold plus a live reel need one AUTO run.
- [2026-10-07] Migration `20261007091557_20261007_radar_video_transcripts` reviewed (one enum, six additive columns) and applied by the Owner; integration specs pass. be-test plan approved and written: policy, transcriber, transcripts phase, downloader cap, normalizer `toVideo`, and the AUTO-only ENRICH hold in run.advance. Radar + AI specs 322/322. The reel branch sends the file inline during ENRICH instead of uploading it to Gemini, as agreed above.
- [2026-10-07] Owner request: the Feed marks video posts. The feed payload carries `video: { durationSec, transcriptStatus }`, and the Progress cell gains a fourth slot, a video icon whose tone shows the transcript state (empty for a post without video, muted for a reel captured before video files were kept). Guide "Progress" table updated. Outstanding: the Detail fold and the Feed icon need one look after an AUTO run with a reel.
- [2026-10-07] Owner run 6/10 asked for the window fix: the Apify upper bound is now the day after the window end (From = To gave an empty window), and a provider notice ("Apify found no posts") or the first unreadable-post reason lands on the run's warning; Runs page shows windows as UTC days. Live AUTO run `01a115d6` (06/10 UTC): 6 posts updated, 3 reels transcribed (65 s spoken, 22 s on-screen text only, 31 s visual only), 3 `radar.transcript` calls about $0.011, estimate above actual tokens. Owner checked the Detail fold and Feed icon.
- [2026-10-07] Done, all ACs satisfied
