# Task: Radar — Item Detail page and workflow profile editor

## Status: pending

## Goal
Show everything known about one post on a record-view Detail page, and let the Owner edit the workflow profile in the console.

## Context
Epic `epic-radar-ai-news` (Phase A). Detail is where the Owner decides whether and how to apply something. Uses the `console-record-*` family per ADR-026.

## Acceptance Criteria
- [ ] The Detail page shows, in the main column: original post text, persisted images with their image notes, link summaries, comment digest (when present), fact-check notes, and the apply note rendered as markdown.
- [ ] The property rail shows tags, signal score, promo and relevant flags, publish date, source, producer (adapter, model), and a link to the original post.
- [ ] If an image's status is `failed`, then the page shows a placeholder with the original URL instead of a broken image.
- [ ] If the item has no enrichment yet, then the page shows the original text and a "pending analysis" state instead of empty sections.
- [ ] Previous/next navigation moves through the current Feed order.
- [ ] A profile page shows the workflow profile markdown and saves edits through the admin endpoint.

## Technical Notes
- Read ADR-026 and `.context/design/patterns/record-detail-layout.md`. Long-form fields → `console-record-field`; scalars → `console-property` in the rail.
- Markdown rendering: check what the console already uses for markdown before adding a dependency.
- Read `.context/design/cookbook/console.md` before writing HTML/SCSS.

## Files to Touch
- libs/console/feature-radar/src/lib/radar.detail/**
- libs/console/feature-radar/src/lib/radar.profile/**
- libs/console/feature-radar/src/lib/radar.routes.ts

## Dependencies
- 406 - feature lib exists
- 404 - enrichment data

## Complexity: M

## Progress Log
