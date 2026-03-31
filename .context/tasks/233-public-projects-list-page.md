# Task: Public /projects list page

## Status: pending

## Goal
Create the public `/projects` page showing all published projects as stacked full-width rows.

## Context
First public page for the Project module. Stacked rows layout (not grid) — each row shows thumbnail, title, oneLiner, tech tags, and date. Click navigates to `/projects/:slug`. SSR for SEO. This is an Angular feature library in the landing app scope.

## Acceptance Criteria
- [ ] New Nx library: `libs/landing/feature-projects/` with correct tags (scope:landing, type:feature)
- [ ] Route `/projects` registered in landing app (lazy loaded)
- [ ] `ProjectDataService` in landing shared data-access lib — calls `GET /projects` public API
- [ ] Page fetches published projects on init (SSR-compatible)
- [ ] Stacked rows layout — each row:
  - Thumbnail image (left side)
  - Title, oneLiner (locale-aware), tech tags (skill names), date range (right side)
  - Click → navigates to `/projects/:slug`
- [ ] Sorted by displayOrder (API handles sorting)
- [ ] No pagination, no filtering (3-4 items)
- [ ] Locale-aware: oneLiner displays in current locale with fallback chain (PRJ-007 / EXP-005 pattern)
- [ ] SSR meta tags: `<title>Projects | Phuong Tran</title>`, `<meta name="description">`
- [ ] Empty state: message if no published projects exist
- [ ] Mobile responsive: rows stack naturally (thumbnail above text on small screens)
- [ ] Uses `landing-*` components (NOT Material) per component domain separation rules

**Specialized Skill:** ng-lib — use for library creation.

## Technical Notes
- Follow existing landing feature pattern: `libs/landing/feature-home/`
- Landing components use `landing-*` selector prefix
- Use `landing/shared/data-access` for API service (or create if not exists)
- Images: use thumbnail URL from API response (already resolved by presenter)
- Date formatting: `Jan 2026 — Present` or `Sep 2025 — Dec 2025`

## Files to Touch
- libs/landing/feature-projects/ (new library)
  - src/lib/projects-page/ (list component)
  - src/lib/project-row/ (row component, optional — could be inline)
- libs/landing/shared/data-access/src/lib/ (add ProjectDataService or project.service.ts)
- apps/landing/src/app/app.routes.ts (add /projects route)

## Dependencies
- 231 - Public API endpoints must be available

## Complexity: M

## Progress Log
