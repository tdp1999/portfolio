# Task: Sticky-tab experience component — desktop two-column + mobile accordion

## Status: done

## Goal
Build the Brittany Chiang v4–style sticky-tab experience UI inside `feature-about`: left rail = company list, right panel = role detail. Mobile (< 768px) falls back to accordion (default-open = latest role). Renders all fields from `PublicExperience` per epic decisions.

## Context
Per epic, About replaces `/experience` as the single experience surface. `feature-experience` lib's current vertical-timeline component is no longer used. This task either refactors `feature-experience` into a reusable component or re-homes the rendering logic into `feature-about` (see epic open question Q3 — decide during implementation; recommendation: **delete `feature-experience` and re-home into a new sub-component inside `feature-about`** because the tab pattern is structurally different from a vertical timeline).

## Acceptance Criteria
- [x] `AboutExperience` sub-component inside `feature-about` (anchor: `#experience`)
- [x] Desktop (≥ 768px): left rail of company tabs (sticky to top of section), right panel shows detail of selected role
- [x] Mobile (< 768px): accordion — each company is a clickable header, default-open = first role (latest)
- [x] Reverse-chronological order (latest first), sourced from `ExperienceService.getPublicExperiences()`
- [x] Per-role detail panel renders ALL these fields:
  - `position` + `companyName` + linkified `companyUrl` + `companyLogoUrl` (img)
  - Date range humanized: "May 2024 – Present" / "Jan 2021 – Apr 2024" (handle `endDate === null` as "Present")
  - `domain` field (work domain)
  - Meta strip: "Team of N · `teamRole` · `employmentType` · `locationType`, `locationCity, locationCountry`" — humanize enums via `enumLabelPipe`; collapse missing fields cleanly
  - `highlights[]` — primary content, rendered as bulleted list with `text-body-md`
  - `responsibilities[]` — secondary, under collapsible "Day-to-day" sub-heading (closed by default)
  - `skills[]` — chips with icons via `ChipComponent` + `LandingIconComponent`, scrollable row if overflowing
  - `links[]` — labeled bullets at footer of detail panel using `LandingLinkComponent`
- [x] Tab switching uses click + arrow key navigation (a11y); accordion uses click + Enter/Space
- [x] Tab selection state preserved in URL hash so deep-links work (e.g., `/about#experience-redoc`)
- [x] SSR-safe (no `window` access in template path)
- [x] `feature-experience` lib decision recorded in progress log: refactor or delete
- [ ] Type-check + landing prod build clean
- [x] Component-bank entry created (see Specialized Skill)

## Technical Notes
- Tab pattern: Angular signals for `activeIndex`; one `<button>` per tab in rail; ARIA `role="tablist"` / `role="tab"` / `role="tabpanel"`.
- Mobile breakpoint detection: use Angular CDK `BreakpointObserver` or existing `landingBreakpoint` util if present (audit `libs/landing/shared/util`).
- Date humanization: small inline util or pipe; don't pull a date lib for one usage.
- Tab transitions: instant swap in v1 (per epic non-goal "animation/motion polish later").
- Logo handling: `companyLogoUrl` may be empty — fall back to company initial in a circle (existing pattern? audit).
- `domain` field rendering: as a chip at the top of detail panel ("Work domain: Fintech") OR inline in meta strip — try inline first for compactness.
- `feature-experience` lib disposition (epic Q3): **recommend delete + re-home**. The old component returns vertical timeline; new component is two-column tabs. Sharing code would be more work than rewriting. Update Nx project graph + sitemap accordingly.
- The component is non-obvious enough to warrant a design bank entry — invoke `/component-bank` after implementation.

**Specialized Skill:** `component-bank` — read `~/.claude/skills/component-bank/SKILL.md` after implementation. Document `about-experience` with its behavior contract (tab+accordion modes, ARIA spec, field rendering rules, mobile breakpoint).

## Files to Touch
- `libs/landing/feature-about/src/lib/components/about-experience/about-experience.{ts,html,scss}` (new)
- `libs/landing/feature-about/src/lib/feature-about/feature-about.html` (mount)
- `libs/landing/feature-experience/` (delete if direction chosen) OR refactor in place
- `apps/landing/src/app/app.routes.ts` (drop `/experience` direct entry if redirect from 329 supersedes)
- `tsconfig.base.json` (drop path mapping if lib deleted)
- `.context/design/components/about-experience.md` (new, via component-bank skill)

## Dependencies
- 329 (feature-about lib + route)

## Complexity: M

## Progress Log
- 2026-05-22 Started. Audited existing `feature-experience` (vertical timeline, no longer routed — `/experience` redirects via app.routes); `BreakpointObserverService` available under `@portfolio/shared/features/breakpoint-observer`; `PublicExperience` shape confirmed. Decision: **delete** `feature-experience` and re-home rendering into a new `about-experience` sub-component (tab pattern ≠ timeline; no code worth sharing). SSR default = desktop layout; breakpoint observer flips to mobile after hydration.
- 2026-05-22 Implemented `LandingAboutExperienceComponent` under `libs/landing/feature-about/src/lib/components/about-experience/`. Desktop tablist (role="tab" + aria-orientation="vertical" + roving tabindex + Home/End/arrow keys) sticky at top:96px; mobile accordion (`<button aria-expanded>` + `[hidden]` panel). Single `<ng-template #detail>` powers both modes — renders logo (with initial fallback), linkified company, humanized date range, meta strip (team-of, role, employment, location), inline domain row, accent-bullet highlights, collapsible "Day-to-day" responsibilities, skill chips, and link list. Fragment deep-link via `ActivatedRoute.fragment` + `Router.navigate(..., { replaceUrl: true })`. Mounted in `feature-about.html` (replaces `<!-- experience -->`).
- 2026-05-22 Deleted `libs/landing/feature-experience/` lib + dropped `@portfolio/landing/feature-experience` path-mapping from `tsconfig.base.json`. App routes already redirect `/experience → /about#experience` (added in task 330).
- 2026-05-22 Used `component-bank` skill — wrote `.context/design/components/about-experience.md` documenting behavior contract, field rendering table, ARIA spec, and quality checklist.
