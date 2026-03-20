# Task: Media Scheduled Jobs (Cleanup + Orphan Detection)

## Status: pending

## Goal
Implement scheduled cron jobs for hard-deleting expired soft-deleted files and detecting orphaned media.

## Context
Soft-deleted files stay on Cloudinary for 30 days (allowing restore). After that, a daily job permanently removes them. Weekly orphan scan flags unreferenced files.

## Acceptance Criteria
- [ ] Daily cleanup job: find soft-deleted media older than 30 days → hard delete from Cloudinary + DB
- [ ] Uses `@Cron` decorator from `@nestjs/schedule`
- [ ] Cleanup dispatches `HardDeleteMediaCommand` for each expired record
- [ ] Logs results: count deleted, any failures
- [ ] Weekly orphan detection job: find media not referenced by any entity → log for review
- [ ] Orphan detection is advisory only (logs, does not auto-delete)
- [ ] Unit tests with mocked repository and clock

## Technical Notes
- Daily cleanup: `@Cron('0 3 * * *')` — runs at 3 AM
- Weekly orphan scan: `@Cron('0 4 * * 0')` — runs Sunday 4 AM
- Orphan detection can be a stub initially since no consumer modules reference media yet
- Use NestJS `ScheduleModule` — may need to import if not already configured
- Consider batch size for cleanup (process in chunks of 50)

## Files to Touch
- apps/api/src/modules/media/application/jobs/media-cleanup.job.ts
- apps/api/src/modules/media/application/jobs/media-cleanup.job.spec.ts

## Dependencies
- 167 (Repository — findExpiredSoftDeleted)
- 169 (HardDeleteMediaCommand)

## Complexity: M

## Progress Log
