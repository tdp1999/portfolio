# Task: Console help viewer (in-app feature guides)

## Status: pending

## Goal
Let the Owner open a feature's guide from inside the console: a (?) button on the page opens a large help view, similar to the macOS Help window, instead of hunting for a file in the repo.

## Context
Feature guides live in the repo as standalone HTML for now (first one: `.context/guides/radar-feature-guide.html`). The Owner chose to keep HTML for its convenience (diagrams, tables, TOC) and upgrade to an in-app viewer later. Radar is the first consumer; the viewer should not be Radar-specific.

## Acceptance Criteria
- [ ] A page that has a guide shows a (?) button in its header; pages without one show nothing.
- [ ] Clicking it opens the guide in a large popup (or a dedicated route, decide during the task) with a table of contents and deep links to a section (e.g. the Feed's "Score" column opens the Score section).
- [ ] The guide is only reachable after login (not a public static file), because it describes internal architecture.
- [ ] The guide source stays a single file per feature in the repo, with no copy to keep in sync.
- [ ] The keyboard shortcut, if any, follows `.context/patterns-hotkeys.md` (guard + inventory entry).

## Technical Notes
- Decide the content format first: keep HTML (iframe or sanitized render) vs convert to markdown rendered by the console. HTML in `apps/console/public/` would be served without auth, which conflicts with the third AC.
- Look at the console's existing overlay primitives (QuickLook, dialogs) before building a new one.
- Contextual entry points: column headers on the Radar Feed (Score, Type, Providers, Status) are good candidates for "?" deep links.

## Files to Touch
- libs/console/shared/ui (viewer component, if shared)
- libs/console/feature-radar (entry point)
- .context/guides/radar-feature-guide.html (content)

## Dependencies
- 406 - Radar Feed exists

## Complexity: M

## Progress Log
- 2026-10-05 Created from Owner request: guide moved into the repo as HTML; in-app viewer deferred to this task.
