# Task: `pnpm checklist:push` script

## Status: done

## Goal
One command sends the Owner's workflow markdown to the API.

## Context
Epic `epic-landing-checklist`. Templates are edited in markdown (source of truth), never on the web. The script is a thin reader; parsing lives in the API (task 429).

## Acceptance Criteria
- [x] When run, the script shall POST every `checklist-lane-*.md`, `bang-tra.md` and `projects/*.md` (except `_template.md`) from the workflow folder to `/api/checklist/sync` and print the created/updated/archived slugs.
- [x] If the API returns a non-2xx status, then the script shall print the response message and exit non-zero.
- [x] If the token env var is missing, then the script shall exit non-zero before any request.
- [x] Verified against the local API: deleting a lane file copy and pushing archives that template.

## Technical Notes
- `tools/checklist/push.ts` (or the repo's existing scripts location, check `package.json` scripts and `tools/`), run with `tsx`/`ts-node` like other repo scripts.
- Env: `CHECKLIST_WORKFLOW_DIR` (default `~/Code/personal/learning/workflow`), `CHECKLIST_API_URL` (default `http://localhost:3000`), `CHECKLIST_SYNC_TOKEN`. Read from the shell env; never read `.env` files in this session (ask the Owner to set them).
- Provide a one-liner in `.context/commands.md` for generating the token + its sha256 hash for Railway.

## Files to Touch
- apps/api/scripts/checklist-push.ts (new)
- package.json (script)
- .context/commands.md

## Dependencies
- 429 - sync endpoint

## Complexity: S

## Progress Log
- [2026-10-08] Started. Mismatch: repo keeps tsx scripts in `apps/api/scripts/`, not `tools/`; the script reuses `ChecklistFilePolicy.classify` so one rule decides which files are checklists.
- [2026-10-08] Verified against the local API: no token → exit 1 before any request; wrong token → `401 Invalid sync token`, exit 1; real folder → 6 files synced; a folder copy without lane S → `archived checklist-lane-s`; a phase-less file → `400 checklist-lane-x.md: no phase found`, exit 1; restore push revived lane S. Token setup documented in commands.md.
- [2026-10-08] Done — all ACs satisfied
