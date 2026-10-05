# Task: Radar — Item Detail page and workflow profile editor

## Status: done

## Goal

Show everything known about one post on a record-view Detail page, and let the Owner edit the workflow profile in the console.

## Context

Epic `epic-radar-ai-news` (Phase A). Detail is where the Owner decides whether and how to apply something. Uses the `console-record-*` family per ADR-026.

## Acceptance Criteria

- [x] The Detail page shows, in the main column: original post text, persisted images with their image notes, link summaries, comment digest (when present), fact-check notes, and the apply note rendered as markdown.
- [x] The property rail shows tags, signal score, promo and relevant flags, publish date, source, producer (adapter, model), and a link to the original post.
- [x] If an image's status is `failed`, then the page shows a placeholder with the original URL instead of a broken image.
- [x] If the item has no enrichment yet, then the page shows the original text and a "pending analysis" state instead of empty sections.
- [x] Previous/next navigation moves through the current Feed order.
- [x] A profile page shows the workflow profile markdown and saves edits through the admin endpoint.

## Technical Notes

- Read ADR-026 and `.context/design/patterns/record-detail-layout.md`. Long-form fields → `console-record-field`; scalars → `console-property` in the rail.
- Markdown rendering: check what the console already uses for markdown before adding a dependency.
- Read `.context/design/cookbook/console.md` before writing HTML/SCSS.

## Files to Touch

- libs/console/feature-radar/src/lib/radar-item.detail/\*\*
- libs/console/feature-radar/src/lib/radar-profile.form/\*\*
- libs/console/feature-radar/src/lib/radar.routes.ts

## Dependencies

- 406 - feature lib exists
- 404 - enrichment data

## Complexity: M

## Progress Log

- 2026-10-05 Started. Detail exists minimal from 406; profile API (GET/PUT /radar/profile) already in place from 404. imageNotes is one text per post, not per image. Markdown via `marked` + Angular sanitizer (no new dependency). Prev/next: Feed params travel in the Detail URL.
- 2026-10-05 Detail: apply note first (the decision), then post, images (+ image notes), links (+ summaries), fact check; absent sections fold into `console-record-empty-sections`. Worker text rendered by a local `markdown` pipe (`marked`) through `[innerHTML]`, so Angular's sanitizer stays on. Failed/unloadable image and video → placeholder linking the original URL (verified by rewriting the API response). Rail adds published date, source, status label, Facebook link, and an Analysis panel (producer, model, analyzed at).
- 2026-10-05 Prev/next: Feed state moved to `radar-feed.util.ts` (parse/serialize/request + `locateInPage`, 8 specs), shared by Feed and Detail. Feed links carry the query params; Detail loads that Feed page, fetches the adjacent page at a boundary, shows "N of M"; Back returns to the same view. Opened without Feed context, the walk uses the default order and hides itself if the item is not on page 1.
- 2026-10-05 Profile: `/radar/profile` (`radar-profile.form`), markdown editor + char counter (20,000) + sticky save bar + unsaved-changes guard; entry button "Workflow profile" on the Feed header. Save round-trip verified against the local API, then restored to empty.
- 2026-10-05 Checks: lib + spec + console tsc clean, eslint clean, lib jest 11/11, `nx build console` OK.
- 2026-10-05 Done — all ACs satisfied
