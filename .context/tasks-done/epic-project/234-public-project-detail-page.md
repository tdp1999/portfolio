# Task: Public /projects/:slug detail page

## Status: done

## Goal
Create the public project detail page with single-column layout (~800px text) and breakout images (~1200px).

## Context
The key page of the Project module — tells the story of each project to recruiters. Layout: hero image → title/metadata → motivation → overview+role → [contextual image] → technical highlights (CAO) → [contextual image] → back/CTA footer. Images from flat gallery list are placed contextually by order — layout decides placement.

## Acceptance Criteria

### Route & Data
- [x] Route `/projects/:slug` registered in landing app (within feature-projects lib)
- [x] Fetches project by slug via `GET /projects/:slug` (SSR-compatible)
- [x] 404 page/redirect for invalid or non-published slugs

### Layout — Single Column + Breakout Images
- [x] Text content container: `max-width: ~800px`, centered
- [x] Breakout images: `max-width: ~1200px`, centered (one CSS class override)
- [x] Generous vertical spacing between sections (consistent rhythm, 4px grid)

### Sections (top to bottom)
- [x] **Hero image:** thumbnail displayed at breakout width (~1200px). Fallback if no thumbnail.
- [x] **Title block (~800px):** title, oneLiner (locale-aware), date range, tech skill tags (badges), source/project URL links (icons)
- [x] **Motivation (~800px):** "Why I built this" — plain text, locale-aware
- [x] **Overview + Role (~800px):** description + role — plain text, locale-aware
- [x] **Contextual image (breakout):** gallery image[0] placed here (if exists)
- [x] **Technical Highlights (~800px):** 2-4 CAO items, each showing Challenge → Approach → Outcome with optional code link. Locale-aware.
- [x] **Contextual image (breakout):** gallery image[1] placed here (if exists)
- [x] **Footer CTA:** "← Back to Projects" link + "Contact me →" link

### Responsiveness & Polish
- [x] Mobile: single column naturally (breakout images become full-width)
- [x] All translatable fields respond to locale switch
- [x] Uses `landing-*` components per domain separation rules
- [x] No animations (per vision.md — clean, minimal)

### SEO (SSR)
- [x] `<title>` = `${title} | Phuong Tran`
- [x] `<meta name="description">` = `oneLiner[currentLocale]`
- [x] `<meta property="og:image">` = `thumbnailUrl`

## Technical Notes
- This is a component within `libs/landing/feature-projects/` (same lib as list page)
- Reuse `ProjectDataService` from task 233 — add `getBySlug(slug): Observable<ProjectDetail>`
- Image placement logic: `images[0]` after overview section, `images[1]` after highlights. Additional images (if any) append at end. Simple `@if (images()[0])` conditional rendering.
- CAO highlight rendering: consider a small `highlight-card` sub-component with challenge/approach/outcome sections
- Breakout image CSS: `.breakout-image { max-width: 1200px; margin-inline: auto; width: 100%; }`

## Files to Touch
- libs/landing/feature-projects/src/lib/project-detail/ (new component)
- libs/landing/feature-projects/src/lib/project-detail/project-detail.html
- libs/landing/feature-projects/src/lib/project-detail/project-detail.scss
- libs/landing/feature-projects/src/lib/ (update routes to add :slug)
- libs/landing/shared/data-access/ (add getBySlug method to ProjectDataService)

## Dependencies
- 233 - List page and data service must exist (shared lib)

## Complexity: L
- Custom layout with breakout images, multiple sections, locale-aware, SSR meta tags

## Progress Log
- [2026-04-05] Started — working alongside task 233
- [2026-04-05] Done — all ACs satisfied
