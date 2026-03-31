# Task: Public /projects/:slug detail page

## Status: pending

## Goal
Create the public project detail page with single-column layout (~800px text) and breakout images (~1200px).

## Context
The key page of the Project module — tells the story of each project to recruiters. Layout: hero image → title/metadata → motivation → overview+role → [contextual image] → technical highlights (CAO) → [contextual image] → back/CTA footer. Images from flat gallery list are placed contextually by order — layout decides placement.

## Acceptance Criteria

### Route & Data
- [ ] Route `/projects/:slug` registered in landing app (within feature-projects lib)
- [ ] Fetches project by slug via `GET /projects/:slug` (SSR-compatible)
- [ ] 404 page/redirect for invalid or non-published slugs

### Layout — Single Column + Breakout Images
- [ ] Text content container: `max-width: ~800px`, centered
- [ ] Breakout images: `max-width: ~1200px`, centered (one CSS class override)
- [ ] Generous vertical spacing between sections (consistent rhythm, 4px grid)

### Sections (top to bottom)
- [ ] **Hero image:** thumbnail displayed at breakout width (~1200px). Fallback if no thumbnail.
- [ ] **Title block (~800px):** title, oneLiner (locale-aware), date range, tech skill tags (badges), source/project URL links (icons)
- [ ] **Motivation (~800px):** "Why I built this" — plain text, locale-aware
- [ ] **Overview + Role (~800px):** description + role — plain text, locale-aware
- [ ] **Contextual image (breakout):** gallery image[0] placed here (if exists)
- [ ] **Technical Highlights (~800px):** 2-4 CAO items, each showing Challenge → Approach → Outcome with optional code link. Locale-aware.
- [ ] **Contextual image (breakout):** gallery image[1] placed here (if exists)
- [ ] **Footer CTA:** "← Back to Projects" link + "Contact me →" link

### Responsiveness & Polish
- [ ] Mobile: single column naturally (breakout images become full-width)
- [ ] All translatable fields respond to locale switch
- [ ] Uses `landing-*` components per domain separation rules
- [ ] No animations (per vision.md — clean, minimal)

### SEO (SSR)
- [ ] `<title>` = `${title} | Phuong Tran`
- [ ] `<meta name="description">` = `oneLiner[currentLocale]`
- [ ] `<meta property="og:image">` = `thumbnailUrl`

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
