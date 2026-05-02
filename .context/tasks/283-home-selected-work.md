# Task: Home Selected Work (B3.d tabbed + mini gallery, B3.b fallback)

## Status: pending

## Goal
Build the Selected Work section per B3.d: 3 tabs (Document Engine first), 40/60 split with text/links left and 2×2 mini gallery right, with B3.b text-only fallback for projects lacking imagery.

## Context
Most visually-heavy home section. Document Engine is "first-among-equals" via tab order alone — no size/weight differentiation. Section gets B2.c indigo top-border lift + tonal background.

## Acceptance Criteria
- [ ] 3 horizontal tabs (mono caps): active = indigo color + 2px indigo bottom underline only; inactive = slate; no pill, fill, or box
- [ ] 1px hairline rule below tab strip
- [ ] Active tab content: 40/60 split — left 40% has year/employer eyebrow → project name sans bold ~48px → 3-line description with one Newsreader serif italic emphasis → vertical link list (`landing-link` with arrows) → tech chip cluster (mono pills)
- [ ] Right 60%: 2×2 grid of `landing-figure` placeholders (real screenshots when imagery is ready, hairline-bordered placeholders + `FIG. 0X · CAPTION` until then)
- [ ] **Fallback rule:** if a project's `images.length < 4`, swap right column to B3.b asymmetric text-only layout (extended description + decisions list); detect at component level, no separate route
- [ ] Section footer caption: `// HOME · SELECTED 03 · /projects FOR FULL ARCHIVE →` mono caps slate with indigo arrow link to `/projects`
- [ ] Section gets B2.c lift (indigo top stripe + bg-ink-1)
- [ ] Tab switch transition ~150-200ms ease (per E4 motion rule)

## Technical Notes
- Reference: `assets/moodboard/stitch-b1/B3d-tabbed-gallery.png`.
- Tab state in component signal; URL fragment optional (`#document-engine`) for shareability.
- Ensure focus management on tab switch for a11y.

## Files to Touch
- `libs/landing/feature-home/src/selected-work/home-selected-work.component.ts`
- `libs/landing/feature-home/src/selected-work/home-selected-work-tab.component.ts`
- `libs/landing/feature-home/src/selected-work/home-selected-work-fallback.component.ts`

## Dependencies
- 274, 278, 279, 280
- 277 (Project API returns links + metadata)

## Complexity: L

## Progress Log
