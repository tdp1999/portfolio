# Task: Apply CRUD template to Tags + Categories pages

## Status: done

## Goal
Apply the CRUD template styling from task 184 to the Tags and Categories management pages.

## Context
Phase 2 of Console UI Redesign. Tags has: search filter. Categories has: search filter. Both are simple CRUD pages with similar structure.

## Acceptance Criteria
- [x] Tags page: "Tag Management" title + subtitle + "Create Tag" button
- [x] Tags filter: search input styled per CRUD template
- [x] Tags table: Name, Slug, Created, Actions columns — dark styled
- [x] Categories page: "Category Management" title + subtitle + "Create Category" button
- [x] Categories filter: search input styled per CRUD template
- [x] Categories table: Name, Slug, Description, Order, Actions columns — dark styled
- [x] Both pages: fixed pagination, footer visible
- [x] Both pages: consistent with CRUD template

## Files to Touch
- `libs/console/feature-tag/src/lib/tags-page/tags-page.html`
- `libs/console/feature-tag/src/lib/tags-page/tags-page.scss`
- `libs/console/feature-category/src/lib/categories-page/categories-page.html`
- `libs/console/feature-category/src/lib/categories-page/categories-page.scss`

## Dependencies
- 184 (CRUD template)

## Complexity: S

## Progress Log
- 2026-03-26 Done — all ACs satisfied
