# Task: RSS feeds (Substack first) as a Radar source

## Status: done

## Goal
The Owner adds an RSS feed, Substack first, as a source and captures its posts into the Feed.

## Context
From `epic-radar-phase-c`. RSS is the cheapest and most durable source: no Apify, no login. Feeds list only recent entries, so backfill uses Substack's archive listing as best effort.

## Acceptance Criteria
- [~] `RadarPlatform` gains `RSS`; the Sources dialog adds a feed from a URL (a Substack home URL resolves to its `/feed`).
- [~] Capture creates one item per entry not seen before for that source and refreshes the ones it has seen (RAD-001); post HTML is reduced to text, images in the post are persisted like other images.
- [~] Backfill for a window uses the Substack archive listing when available; if it fails, the capture keeps the feed entries and records the reason.
- [~] If the feed is unreachable or not valid RSS/Atom, the capture step fails with a named reason and stored items stay.
- [~] Captured posts flow into the `AUTO` analysis.

## Technical Notes
- A small, maintained RSS/Atom parser dependency is fine; check it before adding (prefer one already in the repo).
- Long newsletters: cap the text sent to analysis and say so in the trace.

**Specialized Skill:** prisma-migrate — `RSS` enum value
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — normalizer against a recorded feed fixture, dedupe, archive fallback
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/infrastructure/capture/rss-capture.adapter.ts (new), rss.normalizer.ts (new)
- apps/api/src/modules/radar/application/commands/create-source.command.ts
- apps/api/prisma/schema.prisma + migration
- libs/console/feature-radar/src/lib/** (sources dialog, monogram)

## Dependencies
- 418 - AUTO flow

## Complexity: M

## Progress Log
- [2026-10-07] Aborted by the Owner before it started: RSS / Substack is out of Phase C. Nothing was built; the ACs are marked `[~]` (not done, not wanted). `RadarPlatform` stays FACEBOOK and YOUTUBE.
