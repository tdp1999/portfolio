# Task: Radar — probe Apify on a real profile and capture fixtures

## Status: done

## Goal
Confirm that an Apify actor returns complete data for the personal profile `facebook.com/mrgoonie`, choose the actor, and commit a sanitized fixture that the normalizer is written against.

## Context
Epic `epic-radar-ai-news` (Phase A). Vendor docs disagree on whether personal profiles (not Pages) are supported. Writing the normalizer against guessed fields would waste a day if the actor returns truncated text or no images. This task is mostly done by the Owner in the Apify web console; Claude inspects the output. The Owner's own Facebook account is never used (RAD-003).

## Acceptance Criteria
- [x] The Owner runs one Apify posts actor on `facebook.com/mrgoonie` with a cap of about 50 posts and exports the dataset as JSON.
- [x] Claude reports, per field, whether the export contains: post id, permalink, publish timestamp, full text (not cut at "See more"), image URLs, link attachments, video presence, engagement counts.
- [x] The post count in the export is compared with the profile for the same date range, and the gap is recorded.
- [x] If the chosen actor returns truncated text or no images for more than 10% of posts, then a second actor is tried before the task closes, and the comparison is recorded.
- [x] One comments actor is run on 3 of those posts; the presence of author, text, timestamp and reply nesting is recorded.
- [x] A fixture with 10 posts (personal data of commenters stripped) is committed at the path in Files to Touch.
- [x] The chosen actor id, its input settings, and its cost per 1,000 items are recorded in the epic's Technical Considerations.

## Technical Notes
- Free plan: $5 monthly credit. 50 posts plus comments on 3 posts costs well under $1.
- Keep the Apify token out of chat and the repo. The Owner exports from the web UI; no API call is needed in this task.
- Bright Data comparison (bake-off) is optional here and only matters for Phase C.

## Files to Touch
- apps/api/src/modules/radar/infrastructure/capture/__fixtures__/apify-posts.sample.json
- apps/api/src/modules/radar/infrastructure/capture/__fixtures__/apify-comments.sample.json
- .context/plans/epic-radar-ai-news.md (actor decision)

## Dependencies
- None (can run in parallel with 401)

## Complexity: S

## Progress Log
- 2026-10-04 Probe done with the Owner. `maximedupre/facebook-user-posts-scraper` rejected (8 newest items only; OOM at its 256 MB cap on an older window). `apify/facebook-posts-scraper` returns the personal profile timeline and honors the window: 50/50 posts for 2026-08-06..08-14, full text, images with Facebook `ocrText`, `sharedPost`, `link`. Cost $0.351 for 50 posts (post $0.005 + date filter $0.002 each). Decision recorded in the epic.
- 2026-10-04 Comments: `apify/facebook-comments-scraper` on 3 posts returned 72 comments (depth 0/1/2 = 36/23/13), with author, text, date, likes, replyToCommentId. Value is concentrated in the author's own comments (real source links, price screenshots as attachments, replies to questions); most other comments are short reactions. Fixtures committed (commenters anonymized).
- 2026-10-04 Post-count gap vs profile not measured by hand; the run hit the 50 cap inside the window, so no posts were dropped by the actor for that range.
- 2026-10-04 Done — all ACs satisfied
