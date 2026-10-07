# Task: Brief written by Gemini

## Status: pending

## Goal
A brief requested in the console is written by Gemini in the API, with no Claude Code session.

## Context
From `epic-radar-phase-c`. Today `/radar work brief` claims the pending brief and submits it (task 412). Gemini takes over the same job with the same rules and the same validation.

## Acceptance Criteria
- [ ] When the Owner requests a brief, the API writes it with one Gemini request over the window's enrichments (not the raw posts) and stores it through the same validation as the worker submit.
- [ ] Every claim links to an item in the window; a brief that links outside the window fails validation and is retried once, then marked failed with the reason.
- [ ] If Gemini rate-limits, the brief stays pending and is retried on a later tick.
- [ ] The brief rules move from the skill into the API prompt folder from 418; the skill points to them.
- [ ] The worker brief path keeps working (fallback).

## Technical Notes
- The window may hold many enrichments; send compact fields (tldr, tags, score, context terms, item id) to stay within context and cost.
- Usage rows use feature `radar.brief`.
- Update the "Generate Radar Brief" flow in `.context/domain.md` and the feature guide.

## Files to Touch
- apps/api/src/modules/radar/application/commands/brief.*.ts
- apps/api/src/modules/radar/application/prompts/**
- .claude/skills/radar/SKILL.md
- .context/domain.md, .context/guides/radar-feature-guide.html

## Dependencies
- 418 - prompt folder, Gemini request pattern

## Complexity: S

## Progress Log
