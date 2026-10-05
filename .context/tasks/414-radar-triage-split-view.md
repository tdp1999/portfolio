# Task: Radar — triage split view (Inbox / To try / Done)

## Status: pending

## Goal
Turn the Radar Feed into a split inbox: list on the left, the full Detail chassis on the right, so the Owner can skim a post, decide (Done or To try) with one key, and land on the next post.

## Context
Epic `epic-radar-ai-news`. After 407 the Feed is a table and every post opens a separate Detail page, which is slow for a daily skim. The layout was explored and approved in the DDL study `/ddl/radar-triage` (layout A v2). The study is the visual spec for this task.

Decisions (Owner, 2026-10-05):
- "To try" is a plain saved list: no note, no snooze date.
- Opening a post never changes its status. Status changes only on E (Done) or S (To try).
- Density ships as **compact** only (list 320px, tighter paddings and gaps, font sizes unchanged). The comfortable variant and the density switch are not built.
- Filters keep their place: search, provider, type and min score in the filter bar; sort and "Show promo" on the tab row.

## Acceptance Criteria
- [ ] `RadarItem` has `triageStatus` (`INBOX` default, `SAVED`, `DONE`) and `triagedAt`, added through the `prisma-migrate` skill; existing items backfill to `INBOX`.
- [ ] `PATCH /radar/items/triage` (admin) sets one status for a list of item ids (1 to 100) and returns the updated count; unknown ids are ignored.
- [ ] `GET /radar/items` accepts `triageStatus` and returns per-status counts for the current filters, so the tabs show Inbox / To try / Done counts.
- [ ] The Radar page shows tabs, a list (score, TL;DR, type, providers, age, image and comment counts) and a pane with the Detail chassis for the selected post; the selected post and tab are in the URL.
- [ ] In the pane, Done (E) and To try (S, toggles back to Inbox) change the status and move the selection to the post that took its place; J/K or arrow keys move the selection.
- [ ] After a status change a status line offers Undo (U), which restores the previous status of that change.
- [ ] Below a pane width of about 920px the property rail drops under the post as a grid strip; from about 920px it sits beside the post (container query on the pane, not the viewport).
- [ ] Images in the pane and on the Detail page use `object-fit: contain` (no crop) and open a lightbox at full size; Facebook `ocrText` shows under an image when present.
- [ ] The shortcuts are guarded with `isEditableTarget` and scoped to the Radar page, and are added to the inventory in `.context/patterns-hotkeys.md`.
- [ ] The DDL study `/ddl/radar-triage` is updated to the shipped compact layout (or replaced by a link to the real page) in the same change.
- [ ] Console and API builds pass, one at a time after a RAM check.

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
- apps/api/src/modules/radar/application/commands/set-triage-status.command.ts (+ spec)
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- apps/api/src/modules/radar/infrastructure/repositories/radar-item.repository.ts
- libs/console/feature-radar/src/lib/radar-item.list/*
- libs/console/feature-radar/src/lib/radar-item.detail/* (image contain + lightbox, ocrText)
- .context/patterns-hotkeys.md
- libs/console/feature-ddl/src/lib/ddl-radar-triage/*

## Dependencies
- 406, 407

## Complexity: M

## Progress Log
