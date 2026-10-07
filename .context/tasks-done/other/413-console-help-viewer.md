# Task: Console help viewer (in-app feature guides)

## Status: done

## Goal
Let the Owner open a feature's guide from inside the console: a (?) button on the page opens a large help view, similar to the macOS Help window, instead of hunting for a file in the repo.

## Context
Feature guides live in the repo as standalone HTML for now (first one: `.context/guides/radar-feature-guide.html`). The Owner chose to keep HTML for its convenience (diagrams, tables, TOC) and upgrade to an in-app viewer later. Radar is the first consumer; the viewer should not be Radar-specific.

## Acceptance Criteria
- [x] A page that has a guide shows a (?) button in its header; pages without one show nothing.
- [x] Clicking it opens the guide in a large popup (or a dedicated route, decide during the task) with a table of contents and deep links to a section (e.g. the Feed's "Score" column opens the Score section).
- [x] The guide is served as a static console asset (`/guides/<slug>.html`) with `noindex`; the Owner accepted that it is public (replaces the earlier "only after login" criterion).
- [x] The guide source stays a single file per feature in the repo, with no copy to keep in sync.
- [x] A keyboard shortcut opens the current page's guide (no-op on pages without one) and follows `.context/patterns-hotkeys.md` (guard + inventory entry).

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
- 2026-10-06 Started. Owner dropped the "only after login" criterion: the guide is just a guide, so it ships as a static console asset (option A: build asset + `iframe src`, deep link by URL hash). Viewer reuses QuickLook; a shell-level hotkey opens the page's guide.
- 2026-10-06 Built: QuickLook `document` mode, `HelpService` + `HelpViewer` (shell, `?` key) + `HelpButton`; Radar pages and Feed columns wired; guide copied by a console build asset glob; specs pass, `nx build console` passes. AC1/AC2 wait on a visual check after the Owner restarts the console dev server (new build asset).
- 2026-10-06 Visual check (Playwright, console :4300): header (?) on 6 Radar pages, 4 Feed column links; Score opens at its h3 without sorting; `?` opens each page's section, yields while typing, no-op on /tags; Esc closes with focus inside or outside the iframe. Two fixes found on the way: console CSP `frame-src` lacked `'self'` (iframe blocked), and a matTooltip on the auto-focused "open in new tab" link swallowed the first Escape (now a native `title`).
- 2026-10-06 Done — all ACs satisfied
