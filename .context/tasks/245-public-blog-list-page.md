# Task: Public /blog List Page

## Status: pending

## Goal
Build the public blog list page with post cards, pagination, and category/tag filtering.

## Context
The blog list page is a public-facing page showing all published posts. It supports filtering by category and tag via query params. Uses landing design system components.

## Acceptance Criteria
- [ ] Route: `/blog` in landing app
- [ ] Page header: "Blog" title + subtitle
- [ ] Post cards displaying: featured image (if present), category badges, read time, title, excerpt, publishedAt date
- [ ] Cards link to `/blog/:slug`
- [ ] Category filter: horizontal tabs/pills showing all categories that have published posts
- [ ] Tag filter: optional, shown below category or as query param support
- [ ] URL reflects filters: `/blog?category=tech` or `/blog?tag=typescript`
- [ ] Pagination: "Load More" button or numbered pages
- [ ] Empty state: "No posts yet" message when no published posts
- [ ] SSR: page renders server-side with meta tags
  - `<title>Blog | Phuong Tran</title>`
  - `<meta name="description">` appropriate description
- [ ] Responsive: single column on mobile, cards stack vertically
- [ ] Uses `landing-*` design system components (NOT Angular Material)

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
