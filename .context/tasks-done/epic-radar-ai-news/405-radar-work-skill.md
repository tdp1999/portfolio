# Task: Radar — `/radar work` project skill and first workflow profile

## Status: done

## Goal
Ship a project skill that loops claim → analyze → submit against the worker API, and seed the first `RadarWorkflowProfile` from the Owner's real setup.

## Context
Epic `epic-radar-ai-news` (Phase A). The skill lives in the repo (`.claude/skills/radar/`) so it survives the laptop return. The profile is drafted from the Owner's Claude Code config, skills, plugins and `~/Code/personal/learning/workflow/`, then stored in the DB, never read from disk at run time.

## Acceptance Criteria
- [x] Invoking `/radar work` reads `RADAR_API_URL` and `RADAR_WORKER_TOKEN` from the environment and stops with a clear message if either is missing.
- [x] The skill claims items in batches (default 10), writes one enrichment per item matching the schema from 404, and submits them.
- [x] For each item the skill opens linked sources and reads persisted images before writing `linkSummaries`, `imageNotes` and `factCheck`.
- [x] The `applyNote` is written against the profile fetched from `GET /radar/work/profile`, and states "already in your setup" when the item describes something the profile already contains.
- [x] TL;DR and notes are written in the post's source language; technical terms stay verbatim (RAD-002).
- [x] If a submit returns per-item errors, then the skill fixes and resubmits those items once, and reports any that still fail.
- [x] The skill stops when a claim returns zero items and prints counts (processed, failed).
- [x] A first profile (markdown) is drafted, shown to the Owner for approval, and saved through the admin endpoint.

## Technical Notes
- Batch size and a `--limit` argument keep a session from running out of context; each batch is independent.
- Use `curl` from Bash for the API calls; never echo the token.
- Draft the profile from: `~/.claude*/CLAUDE.md`, installed skills and plugins list, `.claude/` in this repo, and `~/Code/personal/learning/workflow/`. Owner reviews before saving.

**Specialized Skill:** skill-creator — skill structure and description that triggers on "radar work"
**Key sections to read:** writing the SKILL.md and its description

- **Decisions 2026-10-05 (Owner):** (1) the first profile is saved by a script the Owner runs in their own terminal (`read -s` password → login → PUT `/api/radar/profile`), so neither password nor JWT passes through the chat; (2) claim skips items whose source is inactive (added here, closes the deactivate gap from the 404 review).
- **Env:** the skill's Bash shell does not load `~/.zshrc`; `RADAR_WORKER_TOKEN` and `RADAR_API_URL` must live in `~/.zshenv`.
- **Images:** the skill downloads image URLs to a scratch dir with `curl`, then reads them, so the model actually sees them.
- **From 404 (2026-10-05):** submit at most 10 results per request; on HTTP 413 resubmit them one by one. A rejected result keeps the lease, so fix and resubmit in the same session. Items claimed 3 times without a stored result are skipped by claim (re-queue is a console concern).

## Files to Touch
- apps/api/src/modules/radar/infrastructure/repositories/radar-work.repository.ts (claim skips inactive sources)
- apps/api/src/modules/radar/infrastructure/repositories/radar-work.repository.integration.spec.ts
- .claude/skills/radar/scripts/save-profile.sh
- .claude/skills/radar/scripts/radar-api.sh
- .claude/skills/radar/scripts/upload-capture.sh
- .claude/skills/radar/scripts/admin-session.sh
- .claude/skills/radar/SKILL.md
- .claude/skills/radar/references/enrichment-guide.md

## Dependencies
- 404 - worker API and profile endpoint

## Complexity: M

## Progress Log
- 2026-10-05 Started. Owner chose terminal-script profile save and inactive-source filter in claim.
- 2026-10-05 Claim skips inactive sources (EXISTS subquery so the row lock stays on radar_items); integration test added, radar suite 30/30.
- 2026-10-05 Skill written: SKILL.md, references/enrichment-guide.md, scripts/radar-api.sh (check/profile/claim/images/submit with 413 fallback), scripts/save-profile.sh. Script verified end to end against a live in-process API (temporary spec, deleted): env check, 401 message, claim, image skip, 413 one-by-one fallback, mixed batch rejection.
- 2026-10-05 First profile drafted (scratchpad radar-profile.md), waiting for Owner approval. ACs on enrichment quality wait for a real `/radar work` run; blocked on Owner moving RADAR_WORKER_TOKEN + RADAR_API_URL to ~/.zshenv.
- 2026-10-05 Owner approved and saved the first profile via save-profile.sh; worker endpoint returns it. Env moved to ~/.zshenv, `check` ok against production.
- 2026-10-05 Owner ran the new `scripts/upload-capture.sh`: 10 sample posts (task 401 fixture) uploaded to production, images persisted to Cloudinary.
- 2026-10-05 Real run `/radar work --batch 3 --limit 3` on production: 3 claimed, 4 images downloaded and read, 1 facebook link skipped (RAD-003), 3 stored, 0 rejected; stopped at --limit. Apply notes reference the saved profile (one starts with "Đã có trong setup của bạn:"). Reject path exercised on purpose: signalScore 11 rejected with a field reason, fixed and resubmitted, stored. Caveat: none of the 3 posts had a non-facebook link, so WebFetch link summaries are not yet exercised on real data (will be in 408).
- 2026-10-05 Done, all ACs satisfied.
- 2026-10-05 /cap review fixes: token and JWT reach curl through stdin (`--config -`) and the password reaches jq through stdin, so none of them shows in `ps` (verified: curl argv has no token); admin scripts share `admin-session.sh`, check HTTP status and print the API error instead of a null result; image downloads restricted to http(s) incl. redirects, 15 MB cap; temp files live in one dir removed on exit; source URL drops all trailing slashes like the API. Admin scripts verified against a mock API (5 scenarios), radar-api.sh `check`/`profile` re-verified on production.
