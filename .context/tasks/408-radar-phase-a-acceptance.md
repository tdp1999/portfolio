# Task: Radar — Phase A acceptance run on production

## Status: pending

## Goal
Run the Manual flow end to end on Railway with 6 months of real posts, so the Owner can start reading.

## Context
Epic `epic-radar-ai-news` (Phase A checkpoint). Testing on this epic is deliberately light; this real run is the main oracle. Must finish before the laptop return.

## Acceptance Criteria
- [ ] Railway variables `RADAR_WORKER_TOKEN_HASH` is set for "Dashboard API" (set by the Owner; value never shown in chat).
- [ ] The Owner exports 6 months of `facebook.com/mrgoonie` posts from Apify and uploads it through the console.
- [ ] The Feed shows every post in the export exactly once (count in Feed equals unique ids in the file).
- [ ] Uploading the same file a second time creates zero new items.
- [ ] After `/radar work` sessions finish, every item has an enrichment.
- [ ] Images on 5 randomly picked items load from Cloudinary.
- [ ] If any step fails during the run, then the failure and its fix are recorded in this task's Progress Log before closing.
- [ ] Console and API builds pass (`nx build console`, `nx build api`), one at a time after a RAM check.

## Technical Notes
- Apify cost check: record actual items and dollars spent.
- Worker sessions: run in batches; note how many items one Claude Code session handles, to size future runs.

## Files to Touch
- (none expected; fixes go back to the owning task)

## Dependencies
- 403, 405, 406, 407

## Complexity: S

## Progress Log
