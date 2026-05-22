# Task: Sticky-tab experience component — desktop two-column + mobile accordion

## Status: pending

## Goal
Build the Brittany Chiang v4–style sticky-tab experience UI inside `feature-about`: left rail = company list, right panel = role detail. Mobile (< 768px) falls back to accordion (default-open = latest role). Renders all fields from `PublicExperience` per epic decisions.

## Context
Per epic, About replaces `/experience` as the single experience surface. `feature-experience` lib's current vertical-timeline component is no longer used. This task either refactors `feature-experience` into a reusable component or re-homes the rendering logic into `feature-about` (see epic open question Q3 — decide during implementation; recommendation: **delete `feature-experience` and re-home into a new sub-component inside `feature-about`** because the tab pattern is structurally different from a vertical timeline).

## Acceptance Criteria
- [ ] `AboutExperience` sub-component inside `feature-about` (anchor: `#experience`)
- [ ] Desktop (≥ 768px): left rail of company tabs (sticky to top of section), right panel shows detail of selected role
- [ ] Mobile (< 768px): accordion — each company is a clickable header, default-open = first role (latest)
- [ ] Reverse-chronological order (latest first), sourced from `ExperienceService.getPublicExperiences()`
- [ ] Per-role detail panel renders ALL these fields:
  - `position` + `companyName` + linkified `companyUrl` + `companyLogoUrl` (img)
  - Date range humanized: "May 2024 – Present" / "Jan 2021 – Apr 2024" (handle `endDate === null` as "Present")
  - `domain` field (work domain)
  - Meta strip: "Team of N · `teamRole` · `employmentType` · `locationType`, `locationCity, locationCountry`" — humanize enums via `enumLabelPipe`; collapse missing fields cleanly
  - `highlights[]` — primary content, rendered as bulleted list with `text-body-md`
  - `responsibilities[]` — secondary, under collapsible "Day-to-day" sub-heading (closed by default)
  - `skills[]` — chips with icons via `ChipComponent` + `LandingIconComponent`, scrollable row if overflowing
  - `links[]` — labeled bullets at footer of detail panel using `LandingLinkComponent`
- [ ] Tab switching uses click + arrow key navigation (a11y); accordion uses click + Enter/Space
- [ ] Tab selection state preserved in URL hash so deep-links work (e.g., `/about#experience-redoc`)
- [ ] SSR-safe (no `window` access in template path)
- [ ] `feature-experience` lib decision recorded in progress log: refactor or delete
- [ ] Type-check + landing prod build clean
- [ ] Component-bank entry created (see Specialized Skill)

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
