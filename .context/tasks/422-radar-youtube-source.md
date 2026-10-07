# Task: YouTube channels as a Radar source

## Status: pending

## Goal
The Owner adds a YouTube channel as a source and captures its videos for a window into the Feed.

## Context
From `epic-radar-phase-c`. YouTube comes before RSS by the Owner's choice. The channel RSS feed lists only the latest 15 videos, so a window uses the YouTube Data API v3 with an API key (no OAuth, no Owner account, RAD-003).

## Acceptance Criteria
- [ ] `RadarPlatform` gains `YOUTUBE`; the Sources dialog adds a YouTube source from a channel URL or handle and stores its channel id.
- [ ] Capture for a window lists the channel's uploads playlist page by page and creates one item per public video in the window (title as text, description, duration, thumbnail, link), unique per (source, video id) (RAD-001).
- [ ] Capturing again refreshes existing videos and never duplicates them.
- [ ] If `YOUTUBE_API_KEY` is missing or the daily quota is exhausted, the capture step fails with a named reason and items already stored stay.
- [ ] Captured videos flow into the transcript step (421) and the analysis (418) of the same `AUTO` run.
- [ ] Feed and Detail show YouTube items with a fitting source monogram and an "Open on YouTube" link.

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
