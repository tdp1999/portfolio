# Task: YouTube channels as a Radar source

## Status: done

## Goal
The Owner adds a YouTube channel as a source and captures its videos for a window into the Feed.

## Context
From `epic-radar-phase-c`. YouTube comes before RSS by the Owner's choice. The channel RSS feed lists only the latest 15 videos, so a window uses the YouTube Data API v3 with an API key (no OAuth, no Owner account, RAD-003).

## Acceptance Criteria
- [x] `RadarPlatform` gains `YOUTUBE`; the Sources dialog adds a YouTube source from a channel URL or handle and stores its channel id.
- [x] Capture for a window lists the channel's uploads playlist page by page and creates one item per public video in the window (title as text, description, duration, thumbnail, link), unique per (source, video id) (RAD-001).
- [x] Capturing again refreshes existing videos and never duplicates them.
- [x] If `YOUTUBE_API_KEY` is missing or the daily quota is exhausted, the capture step fails with a named reason and items already stored stay.
- [x] Captured videos flow into the transcript step (421) and the analysis (418) of the same `AUTO` run.
- [x] Feed and Detail show YouTube items with a fitting source monogram and an "Open on YouTube" link.

## Technical Notes
- `channels.list` (forHandle or id) → uploads playlist id; `playlistItems.list` (50 per page) until older than the window; `videos.list` for duration. Quota cost is small per page.
- Capture adapter + normalizer picked by platform; keep the Apify path untouched.

**Specialized Skill:** prisma-migrate — `YOUTUBE` enum value, channel id on the source
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — normalizer against a recorded fixture, window cut-off, dedupe
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/infrastructure/capture/youtube-capture.adapter.ts (new), youtube.normalizer.ts (new)
- apps/api/src/modules/radar/application/commands/create-source.command.ts, run.advance.command.ts
- apps/api/prisma/schema.prisma + migration
- libs/console/feature-radar/src/lib/** (sources dialog, monogram, open link)

## Dependencies
- 418 - AUTO flow
- 421 - transcripts (videos are only useful with them)

## Complexity: M

## Progress Log
- [2026-10-07] Started. Decisions with the Owner:
  - The transcript length limit is split by platform: reels keep `RADAR_TRANSCRIPT_MAX_SECONDS` (600), YouTube gets `RADAR_TRANSCRIPT_YOUTUBE_MAX_SECONDS` (default 2700, 45 min). The run budget check still applies.
  - The channel id lives in the source URL: creating a YouTube source resolves the pasted URL or handle to `https://www.youtube.com/channel/UC…`, so no new column (the migration only adds the enum value) and the unique `url` blocks the same channel twice.
  - Provider `youtube`: `start` records the request, `poll` lists the uploads playlist inside the window up to the item cap and hands the video ids over as the dataset ref (kept in step meta), `fetchPage` reads those ids with `videos.list`. A missing key refuses the run at creation, like Apify; a quota or key error during the run fails CAPTURE with a named reason.
  - Comments fetch stays Facebook only; a YouTube run with `fetchComments` is refused.
- [2026-10-07] Built. API: `youtube` capture provider + `youtube-videos` normalizer, source resolution in create-source, run.create picks the provider by platform and refuses Manual or comments on YouTube, per-platform transcript limit, migration `20261007103625_..._radar_youtube_platform` (enum value only). Console: Sources dialog takes a channel URL or `@handle`, Manual and upload are Facebook only, platform-named copy (comments, Watch on, Open on), Fetch comments hidden for YouTube, YouTube monogram is a rounded square. A missing key refuses the source and the run up front instead of failing CAPTURE later; quota and key errors during a run fail CAPTURE with a named reason. 13 specs (normalizer, adapter, run.create, create-source, transcript policy). Docs: feature guide, domain.md, worker enrichment guide.
- [2026-10-07] Live AUTO run `01a11608` (Joshua Morony, window 08/01 to 09/30, cap 3): 3 public videos captured and created, thumbnails stored, 3 transcripts DONE (668 s, 345 s, 484 s), analysis 1 light + 2 deep. AI spend about $0.24 (transcripts $0.127, deep $0.102, light $0.009). Seen: the answer language is mixed on English videos (one English TL;DR, two Vietnamese), although the prompt asks for the post's own language.
- [2026-10-07] Language fix (Owner's choice: follow the post's language): the analysis rules dropped "most answers are in Vietnamese" and now pick the language from the post's text and transcript only, one language for every field. Not yet re-checked on a live run.
- [2026-10-07] Done, all ACs satisfied.
