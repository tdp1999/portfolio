# Task: Phase C acceptance on production

## Status: pending

## Goal
Run the full automatic flow on production once, check the epic's success criteria, and decide what happens to the Claude Code worker path.

## Context
From `epic-radar-phase-c`. Closes the epic the same way 408 closed Phase A.

## Acceptance Criteria
- [ ] Production has `GEMINI_API_KEY`, `AI_GEMINI_BILLING` and `YOUTUBE_API_KEY` set (Owner action) and the AI integration screen shows Gemini configured.
- [ ] One `AUTO` run per source kind (Facebook, YouTube, RSS) reaches `done` with no Claude Code session; every item has a v3 enrichment with sources.
- [ ] A run with a small budget stops at the budget and leaves the rest pending.
- [ ] A brief requested in the console is written by Gemini.
- [ ] The AI integration screen's 30-day cost equals the sum of usage rows.
- [ ] Decision recorded in `decisions.md`: keep or remove the external worker path (worker endpoints, machine token, `/radar work` skill, RAD-004/005); if removed, a follow-up task is created.
- [ ] If any criterion fails, the gap is written in the epic and a fix task is created instead of ticking it.

## Technical Notes
- Never start or restart servers; the Owner deploys. Use the console through Playwright with the creds file, as in earlier acceptance tasks.

## Files to Touch
- .context/plans/epic-radar-phase-c.md (success criteria)
- .context/decisions.md

## Dependencies
- 417, 419, 420, 422, 423

## Complexity: S

## Progress Log
