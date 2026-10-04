# Task: Radar — capture comments and add a comment digest

## Status: pending

## Goal
Capture the comments of each post and have the worker summarize the counter-arguments in them.

## Context
Epic `epic-radar-ai-news` (Phase B). The Owner considers comments the best place for push-back on a post. Nice to have, so it never blocks the posts pipeline.

## Acceptance Criteria
- [ ] For a Hybrid run with comments enabled, the API runs the comments actor only for selected posts (see selection rule) and stores comments (author name, text, timestamp, reply parent) on each item.
- [ ] For a Manual run, the Owner can upload a comments export, matched to items by post id.
- [ ] Claimed work includes the item's comments, and the skill fills `commentDigest` with the main counter-arguments and corrections.
- [ ] If the comments capture fails, then the posts in the run still proceed to analysis, and the run shows a warning instead of failing.
- [ ] The Detail page has a "Fetch comments" action for a single item.
- [ ] Re-capturing comments for an item replaces its comment list (no duplicates).

## Technical Notes
- **Selection rule (cost control, from the task 400 probe).** Comments cost per comment and a 6-month backfill has about 1,000 posts, so never fetch comments for every post. Measured price: $0.0025 per comment + $0.001 per actor start (72 comments = $0.181). Automatic fetch only when the post text points to the comments (`còm`, `comment`, `cmt`, `👇`, "link"), with `resultsLimit` 15, ranked. Everything else is on demand: the Owner clicks "Fetch comments" on the Detail page (worth it for high-score items). Estimate for a 6-month backfill: about 100 matching posts x 15 = about $3.75; fetching 30 comments for every post would be about $79.
- **Where the value is.** In the probe, the author's own comments carried the real source links and price screenshots; most other comments were short reactions. Store all author comments in full; the digest summarizes the rest.
- Cap comments per post (for example 50 top-level) to bound cost and token use.
- Commenters are private individuals: store only what the digest needs; do not show commenter names in the Feed.

## Files to Touch
- apps/api/src/modules/radar/infrastructure/capture/apify-comments.adapter.ts
- apps/api/src/modules/radar/application/commands/upload-capture.command.ts
- apps/api/src/modules/radar/application/commands/claim-work.command.ts
- .claude/skills/radar/SKILL.md

## Dependencies
- 409 - run state machine
- 405 - skill

## Complexity: M

## Progress Log
