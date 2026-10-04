# Task: Radar — `/radar work` project skill and first workflow profile

## Status: pending

## Goal
Ship a project skill that loops claim → analyze → submit against the worker API, and seed the first `RadarWorkflowProfile` from the Owner's real setup.

## Context
Epic `epic-radar-ai-news` (Phase A). The skill lives in the repo (`.claude/skills/radar/`) so it survives the laptop return. The profile is drafted from the Owner's Claude Code config, skills, plugins and `~/Code/personal/learning/workflow/`, then stored in the DB, never read from disk at run time.

## Acceptance Criteria
- [ ] Invoking `/radar work` reads `RADAR_API_URL` and `RADAR_WORKER_TOKEN` from the environment and stops with a clear message if either is missing.
- [ ] The skill claims items in batches (default 10), writes one enrichment per item matching the schema from 404, and submits them.
- [ ] For each item the skill opens linked sources and reads persisted images before writing `linkSummaries`, `imageNotes` and `factCheck`.
- [ ] The `applyNote` is written against the profile fetched from `GET /radar/work/profile`, and states "already in your setup" when the item describes something the profile already contains.
- [ ] TL;DR and notes are written in the post's source language; technical terms stay verbatim (RAD-002).
- [ ] If a submit returns per-item errors, then the skill fixes and resubmits those items once, and reports any that still fail.
- [ ] The skill stops when a claim returns zero items and prints counts (processed, failed).
- [ ] A first profile (markdown) is drafted, shown to the Owner for approval, and saved through the admin endpoint.

## Technical Notes
- Batch size and a `--limit` argument keep a session from running out of context; each batch is independent.
- Use `curl` from Bash for the API calls; never echo the token.
- Draft the profile from: `~/.claude*/CLAUDE.md`, installed skills and plugins list, `.claude/` in this repo, and `~/Code/personal/learning/workflow/`. Owner reviews before saving.

**Specialized Skill:** skill-creator — skill structure and description that triggers on "radar work"
**Key sections to read:** writing the SKILL.md and its description

## Files to Touch
- .claude/skills/radar/SKILL.md
- .claude/skills/radar/references/enrichment-guide.md

## Dependencies
- 404 - worker API and profile endpoint

## Complexity: M

## Progress Log
