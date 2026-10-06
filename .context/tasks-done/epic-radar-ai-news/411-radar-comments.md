# Task: Radar — capture comments and add a comment digest

## Status: done

## Goal
Capture the comments of each post and have the worker summarize the counter-arguments in them.

## Context
Epic `epic-radar-ai-news` (Phase B). The Owner considers comments the best place for push-back on a post. Nice to have, so it never blocks the posts pipeline.

## Acceptance Criteria
- [x] For a Hybrid run with comments enabled, the API runs the comments actor only for selected posts (see selection rule) and stores comments (author name, text, timestamp, reply parent) on each item.
- [x] For a Manual run, the Owner can upload a comments export, matched to items by post id.
- [x] Claimed work includes the item's comments, and the skill fills `commentDigest` with the main counter-arguments and corrections.
- [x] If the comments capture fails, then the posts in the run still proceed to analysis, and the run shows a warning instead of failing.
- [x] The Detail page has a "Fetch comments" action for a single item.
- [x] Re-capturing comments for an item replaces its comment list (no duplicates).
- [x] Posts get a comment tier on Hybrid incremental runs: light (keyword or giveaway bait: 5 top-level, no replies), full (20+ comments, not meme or bait: 15 top-level with replies), or skip (meme heuristic, under 3 comments). Posts with 100+ comments never fetch replies.
- [x] Each stored comment carries a label (`author`, `substantive`, `low`, `spam`) from free heuristics; the item keeps every author comment and at most 50 others (by likes + replies); claim sends only `author` + `substantive`, each cut to 500 characters.
- [x] The analysis can flag `wantsComments`; the list and Detail show it as a hint (no automatic second fetch).
- [x] The item list shows a comment indicator per row: not fetched (`— / N`), fetched (`x / N`), partial (cap hit), failed, plus the `wantsComments` hint.

## Technical Notes
- **Cost plan (agreed 2026-10-06).** Price on the free tier: $0.0025 per comment + $0.001 per actor start. Never use the actor's `onlyCommentsNewerThan` add-on ($0.002 per post).
  - **Automatic fetch on incremental (Hybrid) runs only.** Backfill runs never fetch comments; old posts get them on demand from the Detail page ("Fetch comments").
  - **Selection rule:** the post text points to the comments (`còm`, `comment`, `cmt`, `👇`, `link`) AND the post's own comment count is at least 3 (free signal from the posts payload).
  - **Actor input:** `resultsLimit: 15`, `includeNestedComments: true`, `viewOption: RANKED_THREADED`. Superseded by round 2: one actor run per tier, so up to 3 per run (up to 3 start fees).
  - **Hard cap:** every comments run passes `maxTotalChargeUsd` (default $0.50 per run). When the cap is hit, Apify stops the run, so order the selected posts by priority (newest first) and treat posts with no comments returned as "not fetched", not "no comments".
  - **Cost preview:** the New run dialog shows the comments upper bound before start. Replies are not bounded by `resultsLimit` (see probe), so the preview uses min(post comment count, 15 top-level + replies) and the hard cap is the real guarantee.
  - Expected spend: about $1 per month for comments (about 36 matching posts of about 180), plus about $1.3 for posts; inside the $5 monthly free credit.
- **Probe 2026-10-06 (2 runs, about $0.045 total).**
  - `resultsLimit` is **per post** (limit 3 on 2 posts, replies off: 3 + 3 comments).
  - `resultsLimit` counts **top-level comments only**; replies come on top (limit 5 with replies: 5 top-level + 6 replies on one post).
  - `maxTotalChargeUsd` works: a $0.03 cap stopped run 1 at 11 comments ($0.0285); the second post got nothing.
  - With `RANKED_THREADED`, the author's own top-level comment came first.
  - Top-level items carry `commentsCount` (their reply count).
- **Where the value is.** In the task 400 probe, the author's 5 top-level comments all carried links or screenshots; 8 more author comments were replies answering readers. Other comments were short (median 52 characters). Store all author comments in full; the digest summarizes the rest.
- **Decisions 2026-10-06 (round 2).** Selection = heuristics B (meme: text under 80 characters, image only, no link, no keyword; bait: "comment ... để nhận" patterns) + tiers C, plus the light version of D (analysis flags `wantsComments`, the Owner fetches by hand). Full D (automatic second round after analysis) rejected as too complex for now. Tiers run as separate actor runs (one per input shape); extra start fee $0.001 each.
- **Migration (owner approved).** `RadarItem` gains `commentsStatus` (enum NOT_FETCHED / FETCHED / PARTIAL / FAILED), `commentsFetchedAt`, `commentsFetchedCount`: `comments = []` cannot tell "not fetched" from "none", and the list must not load the JSON to count. Use the `prisma-migrate` skill; the Owner runs `migrate dev`.
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
- 2026-10-06 Started. Re-checked the cost plan against the actor's live pricing and the fixtures: the task's estimate (100 matching posts, $3.75) was low (fixture match rate 20%, so about 200 posts and about $5.8 for a backfill), and the "all posts" figure ($79) was high (about $44, posts average 17.6 comments). Owner chose: no comments on backfill, keyword + count >= 3 on incremental runs, one actor run per batch, `maxTotalChargeUsd` $0.50.
- 2026-10-06 Probe runs on 2 posts (about $0.045): resultsLimit is per post and counts top-level comments only; maxTotalChargeUsd stops the run at the cap. Notes updated.
- 2026-10-06 Owner reviewed edge cases (100+ comments, spam, meme posts, list indicator): approved tiers B + C + light D and the 3-column migration; ACs added. Jev (TypeSafe decision model) under evaluation as a possible selector.
- 2026-10-06 Backend wired: migration `20261006034902_radar_comments_status` applied locally (RadarItem comment status columns, RadarEnrichment.wantsComments, RadarRun.fetchComments + warning). Domain rules in `domain/radar-comments.ts`; `ApifyCommentsAdapter` + shared `ApifyClient`; `RunCommentsPhase` inside ENRICH; `POST sources/:id/comments/upload`, `POST items/:id/comments/fetch`; claim carries filtered comments; feed/detail DTOs carry a comments summary. Type-check clean, 77 radar unit tests pass. Pending: owner decision on moving rules into domain entities (radar domain layer is thin), then specs, FE, SKILL.md, guide.
- 2026-10-06 Owner: Jev was context only, no Jev work. Domain refactor deferred to task 415; 411 finishes in the current structure.
- 2026-10-06 Console wired: New run "Fetch comments" checkbox (HYBRID + windowFrom only), Feed Comments column (`radarCommentsChip` pipe, wantsComments hint dot), Detail Comments section (status, Fetch / Fetch again with confirm, author comments in full, other comments folded with labels, rail property), Runs page yellow warning row, Sources dialog "Upload comments". Skill + enrichment guide updated (claim comments, commentDigest rules, wantsComments, no commenter names). Radar guide: new section 8 Comments, endpoints, data model, error code, gaps. `nx build console` passes, API tsc clean. Pending: specs (be-test plan awaiting approval), runtime check after API + console restart.
- 2026-10-06 Specs (be-test, plan approved): `domain/radar-comments.spec.ts`, `apify-comments.normalizer.spec.ts` (real fixture), `run.comments.phase.spec.ts`, `comments.commands.spec.ts`; radar API 118/118, console feature-radar 20/20. Browser check on the restarted console: Feed Comments column, Detail section + fold + rail property, New run checkbox (on for HYBRID with window, disabled on MANUAL), Sources "Upload comments"; uploading the fixture twice gave 1 post / 23 comments both times (no duplicates). Ticked AC 2, 6, 7, 8, 10.
- 2026-10-06 Still open, each needs something not done yet: AC 1 and AC 5 need a billed Apify call (a HYBRID run with comments, the Detail "Fetch comments"); AC 3 needs a `/radar work` session on an item with comments; AC 4 is unit-tested but the Runs warning row has not been seen live (no run has a warning); AC 9 needs an analysis that sets `wantsComments`. Deviations to note: only the post author's name is stored (commenters stay anonymous), the not-fetched cell shows "N" in grey instead of "— / N", and upload matches by post URL per source rather than per run. Known gap: commenter names can still appear inside comment text as Facebook mentions (e.g. a reply that starts with the person's name).
- 2026-10-06 Live checks on local (Owner approved the billed calls). AC 5: Detail "Fetch comments" on item `b7e89e2f7888` stored 27 comments. AC 1: HYBRID run `01a10f6c-…` with comments planned one `light` job for 3 posts (cap $0.038), stored 3 / 5 / 5 comments, skipped posts under the tier rules, and finished DONE. AC 3: `/radar work` on local, 13 items stored, 0 rejected; the claim carried the kept comments and the 3 items with comments got a `commentDigest` (author's cache-price comment, AgentKit Pi support). AC 9: a promo post with "link in the comments" got `wantsComments`, and the hint shows on the Feed (dot + tooltip) and on Detail. AC 4: failure path covered by `run.comments.phase.spec.ts`; the Runs warning row was checked live by setting a warning on the finished run for a moment, then resetting it to null. Enrichment guide: the "link in the comments" gap now points to the author's comments and `wantsComments`. Known small issue: `commentDigest` bullets render without list markers on Detail (rv-prose list style). Done: all ACs satisfied.
- 2026-10-06 /cap review fixes (5 warnings, INFO checked). Comment results keyed by canonical post URL that keeps the post id param (`permalink.php?story_fbid=`), so two posts no longer collide. PARTIAL only when the cap could have cut the post short (a bounded tier whose worst case fits the cap is never a cap hit; replies counting toward Facebook's total give FETCHED). Detail fetch is now start + poll (`POST items/:id/comments/fetch` returns 202 + jobRef, `POST items/:id/comments/fetch/:jobRef` collects), so a Cloudflare timeout cannot lose a billed result; the console polls every 5 s up to 10 minutes and keeps polling after the page closes. `GET comments/settings` feeds the confirm and New run texts (no hardcoded caps in the console). Comment jobs are aborted when the phase gives up and when the run is cancelled. Claim holds a run's items without comments while its ENRICH is still fetching them. New specs: adapter (status, cap in URL, abort), commands (start, collect, forged jobRef), advance (ENRICH waits for comments), create schema (fetchComments rules), claim hold (integration). Radar API 133/133 + work repo integration 4/4, console feature-radar 20/20.
