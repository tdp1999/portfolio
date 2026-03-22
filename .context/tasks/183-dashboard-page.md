# Task: Dashboard page redesign — welcome, stats, activity, quick actions

## Status: pending

## Goal
Redesign the dashboard home page from "Welcome to the Console." text to a rich dashboard with greeting, stat cards, recent activity feed, and quick action buttons.

## Context
Phase 2 of Console UI Redesign. Reference: Stitch "Portfolio Console Dashboard" screen (783d02d6). All data is mock/hardcoded — structured for future backend integration.

## Acceptance Criteria
- [ ] "Welcome back, Phuong" heading (use current user's name from auth state)
- [ ] Subtitle: "Here's what's happening with your portfolio today."
- [ ] 4 stat cards in a row: Total Posts (24), Media Files (156), Published (18), Drafts (6)
- [ ] Each stat card: label on top, large number, subtle icon, #1a1d27 bg, rounded-xl, border #2d3148
- [ ] Recent Activity section with "View All" link
- [ ] 3 activity items with icon, description, timestamp (e.g., "Published 'Getting Started with NestJS' — 2 hours ago")
- [ ] Quick Actions section: "New Content" (primary blue) + "Media Library" (outlined) buttons
- [ ] Mock data defined via interfaces/types (easy to replace with API later)
- [ ] Responsive: cards wrap on smaller viewports

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
