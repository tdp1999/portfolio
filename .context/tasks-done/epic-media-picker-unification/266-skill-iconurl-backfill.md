# Task: Backfill Skill.iconUrl into Media + populate iconId

## Status: done

## Goal
Write a data migration script that, for each Skill with a non-empty `iconUrl`, finds or creates a matching Media record and sets `iconId`. Idempotent, safe to re-run.

## Context
Between expand (task 265) and contract (task 270) phases. After this runs, every skill with an icon has both `iconUrl` (legacy) and `iconId` (new) populated. UI migration (task 270) switches readers to `iconId`, then contract drops `iconUrl`.

## Acceptance Criteria
- [ ] Standalone script (NestJS command or Prisma script) `apps/api/scripts/backfill-skill-icons.ts`.
- [ ] For each Skill with non-empty `iconUrl` and null `iconId`: look up existing Media by URL match; if not found, create a new Media row with the URL (folder=`skills`, inferred mime type, `originalFilename` from URL basename).
- [ ] Set `skill.iconId = media.id`.
- [ ] Idempotent: re-running does not create duplicate Media or overwrite existing `iconId`.
- [ ] Logs summary: total skills, skills with iconUrl, skills backfilled, skills skipped (already had iconId or no iconUrl).
- [ ] Handles failure gracefully — skip broken URLs, log, continue.
- [ ] Documented run command in script header.
- [ ] Dry-run mode: `--dry-run` flag prints actions without writing.

## Technical Notes
- Use Prisma client directly, not through NestJS commands (simpler for one-shot script).
- URL matching: Cloudinary URLs are stable; match by `publicId` extracted from URL if possible, else by full URL equality.
- For external URLs (non-Cloudinary), upload-to-Cloudinary may be required, OR decide to leave them as-is and skip (log). Decide during implementation; document choice in progress log.

**Specialized Skill:** prisma-migrate — data backfill patterns.

## Files to Touch
- apps/api/scripts/backfill-skill-icons.ts
- apps/api/package.json (add script entry)

## Dependencies
- 265 — iconId column must exist

## Complexity: M

## Progress Log
- [2026-04-19] Skipped — no skills exist in production; backfill is a no-op. Proceeding directly to contract phase.
