# Task: Quality check, Gemini next to Claude Code

## Status: done

## Goal
See Gemini's enrichment next to the existing Claude Code one for about 10 items, and pick the default model, before AUTO becomes the normal way to run.

## Context
From `epic-radar-phase-c`. A single Gemini request does less research than a Claude Code session, so the switch is checked on real items first. Minimal version: a trial table and a plain compare view, no scoring system.

## Acceptance Criteria
- [x] `POST /api/admin/radar/trials` with item ids and a model runs the Gemini analysis on each and stores the result as a `RadarEnrichmentTrial` (item, adapter, model, payload, tokens, cost); the items' current enrichment is not changed.
- [x] If an item has no current enrichment, or the trial call fails, that item is reported in the response and the others still run.
- [x] A compare view (a section in the item Detail page, or one small page) shows the current enrichment and each trial side by side: tldr, overview, context, applyNote, factCheck, sources, plus tokens and cost.
- [x] At least 10 items have a trial with the Flash model and, if Flash falls short, with a Pro model; the Owner's choice of default model per feature is written in the epic's Progress notes.

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
- 2026-10-07 Started. Decisions after checking the code: a deep trial takes ~45 s, so the endpoint accepts the items and runs the trials in the background one by one (trial rows carry RUNNING / DONE / FAILED); the single-item analysis (request build, model chain, one retry) moves out of `ServerAiAdapter` into a shared analyzer used by both; trials take `depth` (default deep) and record feature `radar.trial`; a cheap "Run trial" action on the Detail page.
- 2026-10-07 API done: `RadarAnalyzer` shared with `ServerAiAdapter`, `CreateTrialsHandler` (background queue, cap/auth stop the rest), `ListItemTrialsHandler` (RUNNING older than 15 min reads as Interrupted), `radar_enrichment_trials` table, routes `POST /radar/trials` + `GET /radar/items/:id/trials`; 6 specs pass. Console: "Quality trials" section at the end of the Detail page (depth + model form, compare table). Guide updated. Waiting on the Owner: apply the migration, then the visual check (AC 3) and the 10 trials + model choice (AC 4).
- 2026-10-07 Migration applied; brief and trial integration specs pass. The trials section moved inside the record's content column (in the triage split pane the record fills a fixed-height pane, so a sibling after it was unreachable) and is folded by default as "Model trials", since it is a side tool. Running state shown: spinner on the button, progress bar and an "Analyzing…" cell.
- 2026-10-07 AC 4 settled by the Owner after 4 trials instead of 10: Gemini content is on par with Claude Code and its prose is clearer if a little long; the gap is formatting (bullets written as "•" in one paragraph, no bold terms, no code spans). Default stays the configured chains (deep `gemini-3.8-flash` then `gemini-3.5-flash`, light flash-lite, brief = deep chain). Fix: a "Markdown" section in `radar-analysis.rules.ts`. Reels are not a fair test until task 421 sends the video.
- 2026-10-07 Done — all ACs satisfied

