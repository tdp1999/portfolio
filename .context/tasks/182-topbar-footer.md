# Task: Topbar search + notification bell + footer bar

## Status: pending

## Goal
Add global search input (UI only) and notification bell to topbar. Add persistent footer with copyright, ToS, Privacy, and version.

## Context
Phase 1 of Console UI Redesign. Reference: Stitch Dashboard B screen. Search and notification are UI shells only — no backend integration yet.

## Acceptance Criteria
- [ ] Topbar: search input "Search resources..." with magnifying glass icon (right side, before theme toggle)
- [ ] Topbar: notification bell icon (between search and theme toggle)
- [ ] Search input: dark filled style (#1a1d27 bg, rounded-lg, #94a3b8 placeholder)
- [ ] Search is non-functional (UI placeholder only)
- [ ] Notification bell is non-functional (UI placeholder only)
- [ ] Footer bar visible on ALL pages (inside main layout, below content)
- [ ] Footer left: "© 2026 Console Portfolio Management"
- [ ] Footer center: "Terms of Service · Privacy Policy" (plain text or links)
- [ ] Footer right: "v1.0.0"
- [ ] Footer text: #64748b, 12px, Inter
- [ ] Footer does not overlap with fixed pagination (pagination sits above footer)

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
