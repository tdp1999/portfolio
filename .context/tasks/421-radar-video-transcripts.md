# Task: Video transcripts before analysis

## Status: pending

## Goal
Video items (YouTube videos, Facebook reels) get a transcript that the analysis reads.

## Context
From `epic-radar-phase-c`. In the last worker run, 3 of 23 posts were reels whose content could not be seen. Gemini reads public YouTube URLs directly and accepts uploaded video files.

## Acceptance Criteria
- [ ] `RadarItem` gains transcript text, transcript status (`NONE | PENDING | DONE | FAILED`), failure reason and video duration.
- [ ] In an `AUTO` run, a video item without a transcript gets one before its analysis; the transcript goes into the analysis request (and into the worker claim payload, so Claude Code can use it too).
- [ ] YouTube: the public URL is passed to Gemini as a file part. Reels: the video URL from the capture payload is downloaded and uploaded to Gemini right after capture, before it expires.
- [ ] Before the call, the cost estimated from the duration is checked against the run budget; a video longer than the source's maximum length is skipped with a reason.
- [ ] If a transcript fails (private, too long, expired URL, provider limit), status is `FAILED` with the reason and the item is still analyzed from text and images (RAD-008).
- [ ] The Detail page shows the transcript in a fold under the post.

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
