# Task: Dashboard page redesign — welcome, stats, activity, quick actions

## Status: done

## Goal
Redesign the dashboard home page from "Welcome to the Console." text to a rich dashboard with greeting, stat cards, recent activity feed, and quick action buttons.

## Context
Phase 2 of Console UI Redesign. Reference: Stitch "Portfolio Console Dashboard" screen (783d02d6). All data is mock/hardcoded — structured for future backend integration.

## Acceptance Criteria
- [x] "Welcome back, Phuong" heading (use current user's name from auth state)
- [x] Subtitle: "Here's what's happening with your portfolio today."
- [x] 4 stat cards in a row: Total Posts (24), Media Files (156), Published (18), Drafts (6)
- [x] Each stat card: label on top, large number, subtle icon, #1a1d27 bg, rounded-xl, border #2d3148
- [x] Recent Activity section with "View All" link
- [x] 3 activity items with icon, description, timestamp (e.g., "Published 'Getting Started with NestJS' — 2 hours ago")
- [x] Quick Actions section: "New Content" (primary blue) + "Media Library" (outlined) buttons
- [x] Mock data defined via interfaces/types (easy to replace with API later)
- [x] Responsive: cards wrap on smaller viewports

## Technical Notes
Create interfaces: `DashboardStat`, `ActivityItem`. Use signals for data. The home page component is minimal right now — expand it.

## Files to Touch
- `apps/console/src/app/pages/home/home.ts`
- `apps/console/src/app/pages/home/home.html` (if separate template)
- `apps/console/src/app/pages/home/home.scss` (if separate styles)

## Dependencies
- 180 (background pattern should be visible behind dashboard)

## Complexity: M

## Progress Log
- [2026-03-23] Done — all ACs satisfied. Dashboard with greeting, stats, activity, quick actions. Inline template (external templateUrl not supported in apps/ pages)
