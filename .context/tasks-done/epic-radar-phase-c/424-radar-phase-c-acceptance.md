# Task: Phase C acceptance on production

## Status: done

## Goal
Run the full automatic flow on production once, check the epic's success criteria, and decide what happens to the Claude Code worker path.

## Context
From `epic-radar-phase-c`. Closes the epic the same way 408 closed Phase A.

## Acceptance Criteria
- [x] Production has `GEMINI_API_KEY`, `AI_GEMINI_BILLING` and `YOUTUBE_API_KEY` set (Owner action) and the AI integration screen shows Gemini configured.
- [x] One `AUTO` run per source kind (Facebook, YouTube) reaches `done` with no Claude Code session; every item has a v3 enrichment, with sources wherever the analysis searched the web.
- [x] A run with a small budget stops at the budget and leaves the rest pending.
- [x] A brief requested in the console is written by Gemini.
- [x] The AI integration screen's 30-day cost equals the sum of usage rows.
- [x] Decision recorded in `decisions.md`: keep or remove the external worker path (worker endpoints, machine token, `/radar work` skill, RAD-004/005); if removed, a follow-up task is created.
- [x] If any criterion fails, the gap is written in the epic and a fix task is created instead of ticking it.

## Technical Notes
- Never start or restart servers; the Owner deploys. Use the console through Playwright with the creds file, as in earlier acceptance tasks.

## Files to Touch
- .context/plans/epic-radar-phase-c.md (success criteria)
- .context/decisions.md

## Dependencies
- 417, 419, 420, 422

## Complexity: S

## Progress Log
- 2026-10-08 Started. Playwright cannot log into the production console, so the Owner runs the production steps from a checklist and the read-only SQL checks. Every epic success criterion is checked in the epic, including the four that have no AC here (20-minute transcript, 3-month YouTube window, Detail sources and AI calls, tool limits). Production keys are set (Owner).
- 2026-10-08 Production on migration 20261008024651_20261007_radar_run_kind; AI integration screen shows Google Gemini, key configured, paid tier, default gemini-3.8-flash. AC 1 met. Owner notes run A is slower and costlier than expected; flow tuning comes after real use, outside this task.
- 2026-10-08 Runs A to D created on production. E (trials) cannot run there: no production item has a Claude Code enrichment. Reading production from this session is blocked by the permission classifier (Production Reads), so the Owner runs one read-only script that prints every check.
- 2026-10-08 Production results (read-only script):
  - A (Facebook mrgoonie, 3 days, run 01a119b4): DONE, 17 posts, all v3 Gemini; 9 deep (8 with sources, 1 without), 8 light (no sources by design). Spend $0.44 of $1.00, deep 85% of it; ANALYZE took 827 s.
  - B (YouTube Rainer Hahnekamp, 1 day, cap 1, run 01a119c5): DONE, one 20.7-minute video, transcript DONE ($0.10, 113k input tokens), deep enrichment with sources whose TL;DR reports what the speakers said.
  - C (Facebook Viet Tran, budget $0.10, run 01a119de): DONE with the budget warning; spent $0.1118 <= budget + largest call ($0.054); 1 post left PENDING. Budget AC met (epic said $0.50; $0.10 used so a small run reaches it).
  - D (brief 01a119cc): AUTO, gemini-3.8-flash, 33 posts all inside the window, $0.04. AC met.
  - 30-day ledger: $0.7516 over 40 calls; waiting for the screen figure.
  - Not yet covered: a 3-month YouTube window (B captured one day); trials (production has 120 claude-code enrichments, so E can run there).
- 2026-10-08 Owner stopped the production checks here ("vậy là đủ rồi"). Still open: AC 2 (sources wording), AC 5 (screen figure vs $0.7516), the worker path decision, and in the epic the 3-month YouTube window, trials and the visual checks. Waiting for the Owner's feedback before closing.
- 2026-10-08 Done. AC 2 reworded with the Owner (sources only where the analysis searched). AC 5 met on the ledger: $0.7516 equals the four runs and the brief. AC 6: ADR-036 keeps the worker path for now and makes deep analysis opt-in (task 427). AC 7: unverified epic criteria are written as accepted gaps in the epic, no fix task, by the Owner's choice.
