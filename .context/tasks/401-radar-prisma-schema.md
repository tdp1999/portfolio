# Task: Radar — Prisma models and migration

## Status: done

## Goal
Add the seven Radar models and their enums to the schema and apply the migration locally and on Railway.

## Context
Epic `epic-radar-ai-news` (Phase A). Every later task stores data in these tables. Everything persists in Railway Postgres because the work laptop is returned soon (no local storage).

## Acceptance Criteria
- [x] The schema defines `RadarSource`, `RadarRun`, `RadarStepRun`, `RadarItem`, `RadarEnrichment`, `RadarBrief`, `RadarWorkflowProfile` with the fields listed in the epic's Data Model.
- [x] The database rejects a second `RadarItem` with the same `(sourceId, externalId)` (RAD-001).
- [x] `RadarItem` has a JSONB raw payload column, JSONB media/links/comments columns, a work status, and a lease expiry column.
- [x] `RadarEnrichment` has a 1:1 relation to `RadarItem` and records producer (adapter, model) and schema version.
- [x] Enums cover run flow (`MANUAL`, `HYBRID`), run/step status (`PENDING`, `RUNNING`, `AWAITING_EXTERNAL`, `DONE`, `FAILED`) and step kind (`CAPTURE`, `NORMALIZE`, `ENRICH`, `ANALYZE`, `SYNTHESIZE`).
- [x] Indexes exist for the Feed query: `(sourceId, publishedAt desc)` and work status plus lease expiry.
- [x] The migration applies cleanly on a fresh local database and on Railway through `migrate deploy` at boot.
- [x] If the migration is applied to a database that already has data in other tables, then no existing table is altered.

## Technical Notes
- Purely additive migration, no existing model touched.
- Not rich-text fields: ADR-023 four-column contract does not apply (plain text / markdown only).
- Migration naming `YYYYMMDDHHMMSS_add_radar_models`.

**Specialized Skill:** prisma-migrate — creates and applies the migration, checks for destructive changes
**Key sections to read:** the create/apply flow (additive change, no backup transform needed)

## Files to Touch
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/<timestamp>_add_radar_models/migration.sql

## Dependencies
- None

## Complexity: M

## Progress Log
- 2026-10-04 Started. Using prisma-migrate for the additive migration.
- 2026-10-04 Schema appended (7 models, 6 enums), `prisma validate` passes. Additions vs epic: `RadarItem.kind` (POST/REEL/VIDEO/SHARE), `sharedPost` JSON (Apify returns the original post of a share), `engagement` JSON, `claimCount`, `lastRunId`; `RadarBrief` got `workStatus` + `leaseExpiresAt` so the worker can claim briefs (task 412). Enrichment `providerTags`/`contentType` are strings (enum lives in a shared Zod constant, task 404) so tag vocabulary changes need no migration.
- 2026-10-04 Migration `20261004135808_add_radar_models` generated and reviewed: 6 CREATE TYPE, 7 CREATE TABLE, 16 indexes (incl. GIN on providerTags), 6 FKs between radar_* tables only, 0 DROP. Applied locally; `prisma generate` ok; api `tsc --noEmit` clean.
- 2026-10-04 Verified RAD-001 at DB level: a second insert with the same (sourceId, externalId) fails with 23505 on `radar_items_sourceId_externalId_key`. Test rows removed.
- 2026-10-04 Outstanding: AC "applies on Railway via migrate deploy at boot" is verified only after the next deploy of the API (push to master). Status stays in-progress until then.
- 2026-10-04 Railway deploy of 25c910aa (Dashboard API) logged "Applying migration `20261004135808_add_radar_models`" and "All migrations have been successfully applied."
- 2026-10-04 Done — all ACs satisfied
