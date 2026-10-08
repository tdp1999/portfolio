# Task: Brief written by Gemini

## Status: done

## Goal
A brief requested in the console is written by Gemini in the API, with no Claude Code session.

## Context
From `epic-radar-phase-c`. Today `/radar work brief` claims the pending brief and submits it (task 412). Gemini takes over the same job with the same rules and the same validation.

## Acceptance Criteria
- [x] When the Owner requests a brief, the API writes it with one Gemini request over the window's enrichments (not the raw posts) and stores it through the same validation as the worker submit.
- [x] Every claim links to an item in the window; a brief that links outside the window fails validation and is retried once, then marked failed with the reason.
- [x] If Gemini rate-limits, the brief stays pending and is retried on a later tick.
- [x] The brief rules move from the skill into the API prompt folder from 418; the skill points to them.
- [x] The worker brief path keeps working (fallback).

## Technical Notes
- The window may hold many enrichments; send compact fields (tldr, tags, score, context terms, item id) to stay within context and cost.
- Usage rows use feature `radar.brief`.
- Update the "Generate Radar Brief" flow in `.context/domain.md` and the feature guide.

**Specialized Skill:** prisma-migrate, for the writer and error columns.
**Specialized Skill:** be-test, for the write handler, entity and tick specs.

## Files to Touch
- apps/api/src/modules/radar/application/commands/brief.*.ts
- apps/api/src/modules/radar/application/prompts/**
- .claude/skills/radar/SKILL.md
- .context/domain.md, .context/guides/radar-feature-guide.html

## Dependencies
- 418 - prompt folder, Gemini request pattern

## Complexity: S

## Progress Log
- 2026-10-07 Started. Design: the Owner picks the writer on create (Auto default, Claude Code the alternative; Auto refused without a key). New columns `writer` (enum, default WORKER for old rows) and `error`. The tick writes one pending AUTO brief per tick, beside the run loop (own in-process flag), so a long brief never delays runs. One structured request over compact analyses (max 800 posts, best scores kept), no tools, feature `radar.brief`, config `brief` pass (`RADAR_AI_BRIEF_MODELS`, default the deep chain, 300 s timeout). Invalid links: one retry with the bad ids, then failed. Busy or daily cap: back to pending. Other failure: failed with reason (DONE, empty body, `error`). Worker claim takes WORKER briefs only.
- 2026-10-07 Done in code: `WriteAutoBriefHandler`, `RadarBrief.fail`, repo `claim(writer)` + `release`, `radar-brief.rules.ts` + `radar-brief.prompt.ts` (skill section 5 now points to the rules file), console writer picker + Queued/Failed statuses. Specs pass (unit); the repository integration spec needs the migration applied. domain.md flow and the guide updated.
- 2026-10-07 Live AUTO brief written for 2026-10-01 to 2026-10-07, one source, 19 posts: provider and topic sections with item links, status went Queued to Being written to Ready. Follow-ups from the Owner's read: points were bare lines (now one list item each, product names bold, CLI names in backticks) and every link read "Duy Nguyen, dd/mm" on a one-source brief (labels now prefer the post's product or topic). A spinner now sits beside the status badge on the brief list and detail while a brief is not written.
- 2026-10-07 Done — all ACs satisfied

