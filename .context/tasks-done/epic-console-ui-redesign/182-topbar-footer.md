# Task: Topbar search + notification bell + footer bar

## Status: done

## Goal
Add global search input (UI only) and notification bell to topbar. Add persistent footer with copyright, ToS, Privacy, and version.

## Context
Phase 1 of Console UI Redesign. Reference: Stitch Dashboard B screen. Search and notification are UI shells only — no backend integration yet.

## Acceptance Criteria
- [x] Topbar: search input "Search resources..." with magnifying glass icon (right side, before theme toggle)
- [x] Topbar: notification bell icon (between search and theme toggle)
- [x] Search input: dark filled style (#1a1d27 bg, rounded-lg, #94a3b8 placeholder)
- [x] Search is non-functional (UI placeholder only)
- [x] Notification bell is non-functional (UI placeholder only)
- [x] Footer bar visible on ALL pages (inside main layout, below content)
- [x] Footer left: "© 2026 Console Portfolio Management"
- [x] Footer center: "Terms of Service · Privacy Policy" (plain text or links)
- [x] Footer right: "v1.0.0"
- [x] Footer text: #64748b, 12px, Inter
- [x] Footer does not overlap with fixed pagination (pagination sits above footer)

## Technical Notes
Footer should be part of `ConsoleMainLayoutComponent` template, placed after `<router-outlet>` content area. Not position:fixed — it flows after content. The pagination bar (task 186) will be position:sticky above it.

## Files to Touch
- `libs/console/shared/ui/src/lib/main-layout/main-layout.html`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.scss`
- `libs/console/shared/ui/src/lib/main-layout/main-layout.ts` (if adding new components/imports)

## Dependencies
- None

## Complexity: M

## Progress Log
- [2026-03-23] Done — all ACs satisfied. Search input, bell icon, footer added to main-layout
