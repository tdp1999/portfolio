# Task: Quality check, Gemini next to Claude Code

## Status: pending

## Goal
See Gemini's enrichment next to the existing Claude Code one for about 10 items, and pick the default model, before AUTO becomes the normal way to run.

## Context
From `epic-radar-phase-c`. A single Gemini request does less research than a Claude Code session, so the switch is checked on real items first. Minimal version: a trial table and a plain compare view, no scoring system.

## Acceptance Criteria
- [ ] `POST /api/admin/radar/trials` with item ids and a model runs the Gemini analysis on each and stores the result as a `RadarEnrichmentTrial` (item, adapter, model, payload, tokens, cost); the items' current enrichment is not changed.
- [ ] If an item has no current enrichment, or the trial call fails, that item is reported in the response and the others still run.
- [ ] A compare view (a section in the item Detail page, or one small page) shows the current enrichment and each trial side by side: tldr, overview, context, applyNote, factCheck, sources, plus tokens and cost.
- [ ] At least 10 items have a trial with the Flash model and, if Flash falls short, with a Pro model; the Owner's choice of default model per feature is written in the epic's Progress notes.

## Technical Notes
- Reuse the adapter's request builder from 418; a trial is the same call with a different storage target.
- No console trigger needed if a curl through the admin JWT is enough for the Owner; add a button only if it is cheap.

**Specialized Skill:** prisma-migrate — `radar_enrichment_trials`
**Key sections to read:** §Step 2, §Step 6

## Files to Touch
- apps/api/src/modules/radar/application/commands/trial.create.command.ts (new)
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- apps/api/prisma/schema.prisma + migration
- libs/console/feature-radar/src/lib/radar-item.record/** or a small new page

## Dependencies
- 418 - Gemini analysis adapter

## Complexity: S

## Progress Log
