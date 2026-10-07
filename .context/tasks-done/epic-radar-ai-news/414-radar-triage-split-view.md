# Task: Radar — triage split view (Inbox / To try / Done)

## Status: done

## Goal
Turn the Radar Feed into a split inbox: list on the left, the full Detail chassis on the right, so the Owner can skim a post, decide (Done or To try) with one key, and land on the next post.

## Context
Epic `epic-radar-ai-news`. After 407 the Feed is a table and every post opens a separate Detail page, which is slow for a daily skim. The layout was explored and approved in the DDL study `/ddl/radar-triage` (layout A v2). The study is the visual spec for this task.

Decisions (Owner, 2026-10-05):
- "To try" is a plain saved list: no note, no snooze date.
- Opening a post never changes its status. Status changes only on E (Done) or S (To try).
- Density ships as **compact** only (list 320px, tighter paddings and gaps, font sizes unchanged). The comfortable variant and the density switch are not built.
- Filters keep their place: search, provider, type and min score in the filter bar; sort and "Show promo" on the tab row.
- (2026-10-06) A decision does not move the selection: the post stays open with its button turned into Unmark done / Unsave. The separate Undo line and the U key are dropped.
- (2026-10-06) The table stays: Split is an added view mode, not a replacement. Tabs filter both views; E/S/J/K act in Split only. The last used view is remembered in localStorage; `?view=` wins.

## Acceptance Criteria
- [x] `RadarItem` has `triageStatus` (`INBOX` default, `SAVED`, `DONE`) and `triagedAt`, added through the `prisma-migrate` skill; existing items backfill to `INBOX`.
- [x] `PATCH /radar/items/triage` (admin) sets one status for a list of item ids (1 to 100) and returns the updated count; unknown ids are ignored.
- [x] `GET /radar/items` accepts `triageStatus` and returns per-status counts for the current filters, so the tabs show Inbox / To try / Done counts.
- [x] The Radar page keeps the current table and adds a view switch (Table / Split). The choice is in the URL (`?view=split`) and remembered per browser; the Inbox / To try / Done tabs filter both views.
- [x] The Split view shows a list (score, TL;DR, source monogram, age, progress icons with image and comment counts) and a pane with the Detail chassis for the selected post; the selected post and tab are in the URL.
- [x] In the pane, Done (E) and To try (S) change the status, and pressing either again on a post that carries it sends it back to Inbox; J/K or arrow keys move the selection.
- [x] After a status change the post stays open and in place, and its decision button turns into its own undo (Unmark done / Unsave, same key), which sends it back to Inbox. The post leaves the tab on the next load.
- [x] Below a pane width of about 920px the property rail drops under the post as a grid strip; from about 920px it sits beside the post (container query on the pane, not the viewport).
- [x] Images in the pane and on the Detail page use `object-fit: contain` (no crop) and open a lightbox at full size; Facebook `ocrText` shows under an image when present.
- [x] The shortcuts are guarded with `isEditableTarget` and scoped to the Radar page, and are added to the inventory in `.context/patterns-hotkeys.md`.
- [x] The DDL study `/ddl/radar-triage` is updated to the shipped compact layout (or replaced by a link to the real page) in the same change.
- [x] Console and API builds pass, one at a time after a RAM check.

## Technical Notes
- Visual spec: `libs/console/feature-ddl/src/lib/ddl-radar-triage/` (frame width math, container query, compact spacing).
- Width budget measured in the study: content = viewport − sidebar − 64, capped at 1440. Rail fits beside the post only at 1440 with the 64px sidebar, at 1512+ with the 64px sidebar, or at 1920.
- Keep `/radar/items/:id` as the deep-link full page; "Open full" in the pane goes there with the Feed query params.
- Bulk "mark done below score N" is out of scope for now; the endpoint already takes a list so it can be added later.
- `--type-scale` is already 0.8: density comes from spacing, never smaller fonts.

**Specialized Skill:** prisma-migrate — for the `triageStatus` column and backfill

## Files to Touch
- apps/api/prisma/schema.prisma (+ migration)
- apps/api/src/modules/radar/application/radar.dto.ts
- apps/api/src/modules/radar/application/commands/item.triage.command.ts (+ spec)
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- apps/api/src/modules/radar/infrastructure/repositories/radar-item.repository.ts
- libs/console/feature-radar/src/lib/radar-item.list/*
- libs/console/feature-radar/src/lib/radar-item.triage/* (Split view: list + pane + keys)
- libs/console/feature-radar/src/lib/radar-item.record/* (Detail body, shared by the page and the pane)
- libs/console/shared/ui/src/styles/patterns/_record-view.scss (`.rv-pane` container query)
- libs/console/feature-radar/src/lib/radar-item.detail/* (image contain + lightbox, ocrText)
- .context/patterns-hotkeys.md
- libs/console/feature-ddl/src/lib/ddl-radar-triage/*

## Dependencies
- 406, 407

## Complexity: M

## Progress Log

- 2026-10-06 Started. Owner: keep the table and add a Split view mode (see Decisions). Verified: the Detail gallery already uses `object-fit: contain` + QuickLook lightbox; only the post images' `ocrText` caption is missing. The Detail body will be extracted into a shared `radar-item.record` component used by the page and the pane.
- 2026-10-06 Migration `20261006072853_20261006_radar_item_triage` created and reviewed (enum + NOT NULL default + nullable + index: all safe); waiting for the Owner to apply it. Console: Detail body extracted into `radar-item.record`; Split view in `radar-item.triage`; tabs, view switch (URL + localStorage), undo line and Split sort on the Feed; `.rv-pane` container query added to the shared record chassis; ocrText caption under post images and in Quick Look. Hotkeys inventory, feature guide (triage section + endpoints) and the DDL study (compact only, link to the real view) updated. `nx build console` passes.
- 2026-10-06 Owner rework: Split opens from the table (list turns compact, pane slides in, X/Esc back); Radar pages capped at 1920 (`--console-page-max` on the radar lists only), Feed full-width; list and pane scroll apart (`.rv-pane--fill`); table drops Type/Provider for a Progress icon column (queue state, comments, images) and a source monogram; filters split into Search/Status/Source plus a `console-filter-more` popover; summary on one line. With a post open the header compacts (tabs, Sort and View join the filter row, subtitle hidden) and a `compact` paginator sits under the list. A decision keeps the post open in place and turns its button into Unmark done / Unsave; the Undo line and U key are gone. Guide and hotkeys updated. `nx build console` and `nx build api` pass. Done: all ACs satisfied.
