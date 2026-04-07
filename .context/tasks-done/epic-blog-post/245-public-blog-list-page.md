# Task: Public /blog List Page

## Status: done

## Goal
Build the public blog list page with post cards, pagination, and category/tag filtering.

## Context
The blog list page is a public-facing page showing all published posts. It supports filtering by category and tag via query params. Uses landing design system components.

## Acceptance Criteria
- [x] Route: `/blog` in landing app
- [x] Page header: "Blog" title + subtitle
- [x] Post cards displaying: featured image (if present), category badges, read time, title, excerpt, publishedAt date
- [x] Cards link to `/blog/:slug`
- [x] Category filter: horizontal tabs/pills showing all categories that have published posts
- [x] Tag filter: optional, shown below category or as query param support
- [x] URL reflects filters: `/blog?category=tech` or `/blog?tag=typescript`
- [x] Pagination: "Load More" button or numbered pages
- [x] Empty state: "No posts yet" message when no published posts
- [x] SSR: page renders server-side with meta tags
  - `<title>Blog | Phuong Tran</title>`
  - `<meta name="description">` appropriate description
- [x] Responsive: single column on mobile, cards stack vertically
- [x] Uses `landing-*` design system components (NOT Angular Material)

## Technical Notes
- Fetch data from `GET /blog` public endpoint with query params (page, limit, categorySlug, tagSlug)
- Category list: either fetch from `/categories` endpoint or extract from post data
- SSR data resolution: use Angular route resolver or `afterNextRender` pattern
- Posts sorted by publishedAt DESC (API default)
- Featured image: display as card thumbnail if present, placeholder/gradient if not
- Follow landing page patterns from `.context/design/landing.md`

## Files to Touch
- `apps/landing/src/app/` (new blog route + page component)
- Landing app routing config (add /blog route)
- Blog list page component + template + styles (new)
- Blog API service (new — calls public endpoints)

## Dependencies
- 242-blog-post-controller-module (public API endpoints)

## Complexity: M
Standard list page with filtering and pagination. No complex interactivity. Landing design system already established.

## Progress Log
- 2026-04-07 Done — created `libs/landing/feature-blog` (project name `landing-feature-blog`), added `BlogDataService` + types in `libs/landing/shared/data-access`, wired `/blog` route in `apps/landing` with category filter, pagination, SSR meta tags, empty state. Tag filter via `?tag=` query param honored by service.
