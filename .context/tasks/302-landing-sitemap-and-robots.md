# Task: Landing sitemap + robots.txt

## Status: pending

## Goal
Generate `sitemap.xml` from the prerendered route list and ship a `robots.txt`. Final SEO polish (OG image, JSON-LD Person, etc.) happens in E6.

## Context
Search indexing needs both files. Keep this minimal — just enumerate the routes and set sane defaults.

## Acceptance Criteria
- [ ] `sitemap.xml` generated at build time from the prerender route list (home, /projects, /projects/:slug × N, /uses, /colophon)
- [ ] `lastmod` populated from project updatedAt where applicable, current build date for static pages
- [ ] `robots.txt` allows all crawlers, references the sitemap URL
- [ ] Both files served at root paths (`/sitemap.xml`, `/robots.txt`) by the SSR server
- [ ] Smoke check: `curl <site>/sitemap.xml` returns 200 + valid XML

## Technical Notes
- A simple build-time script that consumes the prerender route list is enough; no need for a runtime sitemap generator.
- `robots.txt` content can be static.

## Files to Touch
- `apps/landing/scripts/generate-sitemap.ts`
- `apps/landing/src/assets/robots.txt`
- `apps/landing/project.json` (post-build hook)

## Dependencies
- 300

## Complexity: S

## Progress Log
