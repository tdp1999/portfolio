# Task: Landing page experience timeline integration

## Status: done

## Goal
Integrate dynamic Experience data into the landing page — dedicated Experience page with career timeline and brief overview on home page, with SSR, multi-language support, and graceful fallbacks.

## Context
This is the second module providing dynamic data to the landing page (after Profile). The Experience page is a core page in the vision (listed in vision.md as "Experience Page: Detailed professional career history"). Landing page fetches from public API `GET /experiences` and displays a chronological timeline.

## Acceptance Criteria

### Data Service
- [x] `ExperienceService` in landing shared data-access library
- [x] Fetches from `GET /experiences` (public, no auth)
- [x] Returns typed `PublicExperience[]` with skills and companyLogoUrl
- [x] SSR-compatible (works with Angular HttpClient transfer state)
- [x] Error handling: returns empty array on failure (graceful degradation)

### Experience Page (dedicated)
- [x] Route: `/experience` in landing app
- [x] Career timeline layout (vertical, chronological, most recent at top)
- [x] Per entry displays:
  - Company logo (with fallback: first letter of companyName or generic icon)
  - companyName (with optional link to companyUrl)
  - position (in current locale)
  - Date range: "Jan 2023 – Present" or "Mar 2021 – Dec 2022" with duration calculation (e.g., "2 years 3 months")
  - Employment type badge (Full-time, Contract, Freelance, etc.)
  - Location type badge (Remote, Hybrid, On-site) + locationCity, locationCountry
  - description paragraph (in current locale, if provided)
  - achievements as bulleted list (in current locale)
  - teamRole display (in current locale, if provided)
  - domain/industry tag (if provided)
  - teamSize indicator (if provided, e.g., "Team of 8")
  - Skills as tag chips
- [x] "Current" indicator for ongoing positions (endDate null): green dot, "Present" label, or highlighted styling
- [x] Empty state when no experiences exist ("Career history coming soon" or similar)

### Home Page Overview
- [x] Brief section showing 2-3 most recent positions
- [x] Per entry: companyName, position, date range (compact)
- [x] "View full career history →" link to `/experience` page
- [x] Uses same `ExperienceService` data (no extra API call if already fetched)

### Multi-Language
- [x] All translatable fields (position, description, achievements, teamRole) display in current locale
- [x] Uses `getLocalized()` fallback chain: requested locale → en → first available (EXP-005)
- [x] Locale switch updates displayed text without page reload

### SSR
- [x] Experience data fetched server-side for initial render
- [x] SEO: page title and meta description set for Experience page
- [x] Transfer state prevents duplicate API call on client hydration

### Responsive Design
- [x] Timeline layout adapts to mobile (single column)
- [x] Badges and chips wrap appropriately on small screens
- [x] Company logos sized consistently

## Technical Notes
- Follow Profile landing integration pattern (task 213) for SSR data fetching
- Timeline layout: use `landing-*` components exclusively (no Material in landing)
- Duration calculation: `differenceInMonths(endDate || now, startDate)` — format as "X years Y months"
- Company logo fallback: CSS `::before` pseudo-element with first letter, hidden when image loads
- Skills chips: reuse landing badge/chip component if available
- Locale handling: inject current locale from i18n service, pass to `getLocalized()`

## Files to Touch
- New: landing shared data-access service for experiences
- New: landing experience page component
- Update: landing home page (add experience overview section)
- Update: landing app routes (add `/experience` route)
- Update: landing navigation (add Experience link)

## Dependencies
- 221 (Public API endpoints must exist)

## Complexity: L

## Progress Log
- 2026-04-05 Started
- 2026-04-05 Done — all ACs satisfied
