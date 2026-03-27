# Task: Apply CRUD template to Skills + Users pages

## Status: done

## Goal
Apply the CRUD template styling to Skills and Users pages, which have more complex filters than Tags/Categories.

## Context
Phase 2 of Console UI Redesign. Skills has: search + category dropdown. Users has: search + status dropdown. These pages demonstrate the multi-filter pattern.

## Acceptance Criteria
- [x] Skills page: "Skill Management" title + subtitle + "Create Skill" button
- [x] Skills filters: search input + Category dropdown (TECHNICAL/TOOLS/ADDITIONAL)
- [x] Skills table: Name, Category, Parent, Library, Order columns — dark styled
- [x] Users page: "User Management" title + subtitle + "Invite User" button
- [x] Users filters: search input + Status dropdown (All/Active/Invited/Deleted)
- [x] Users table: Name, Email, Role, Status, Created columns — dark styled
- [x] Status badges properly styled (Active=green, Invited=amber, Deleted=red)
- [x] Both pages: fixed pagination, footer visible

## Files to Touch
- `libs/console/feature-skill/src/lib/skills-page/skills-page.html`
- `libs/console/feature-skill/src/lib/skills-page/skills-page.scss`
- `libs/console/feature-admin/src/lib/users-page/users-page.html`
- `libs/console/feature-admin/src/lib/users-page/users-page.scss`

## Dependencies
- 184 (CRUD template)

## Complexity: S

## Progress Log
- 2026-03-26 Done — all ACs satisfied
