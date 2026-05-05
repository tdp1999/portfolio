# Task: Home Selected Work (B3.d tabbed + mini gallery, B3.b fallback)

## Status: done

## Goal
Build the Selected Work section per B3.d: 3 tabs (Document Engine first), 40/60 split with text/links left and 2×2 mini gallery right, with B3.b text-only fallback for projects lacking imagery.

## Context
Most visually-heavy home section. Document Engine is "first-among-equals" via tab order alone — no size/weight differentiation. Section gets B2.c indigo top-border lift + tonal background.

## Acceptance Criteria
- [x] 3 horizontal tabs (mono caps): active = indigo color + 2px indigo bottom underline only; inactive = slate; no pill, fill, or box
- [x] 1px hairline rule below tab strip
- [x] Active tab content: 40/60 split — left 40% has year/employer eyebrow → project name sans bold ~48px → 3-line description with one Newsreader serif italic emphasis → vertical link list (`landing-link` with arrows) → tech chip cluster (mono pills)
- [x] Right 60%: 2×2 grid of `landing-figure` placeholders (real screenshots when imagery is ready, hairline-bordered placeholders + `FIG. 0X · CAPTION` until then)
- [x] **Fallback rule:** if a project's `images.length < 4`, swap right column to B3.b asymmetric text-only layout (extended description + decisions list); detect at component level, no separate route
- [x] Section footer caption: `// HOME · SELECTED 03 · /projects FOR FULL ARCHIVE →` mono caps slate with indigo arrow link to `/projects`
- [x] Section gets B2.c lift (indigo top stripe + bg-ink-1)
- [x] Tab switch transition ~150-200ms ease (per E4 motion rule)

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
- 2026-05-05 Started; built 3-component split under `selected-work/` (orchestrator + tab + fallback) plus shared italic-runs parser
- 2026-05-05 Wired into feature-home; placeholder removed; spec updated (4 placeholders + selected-work assertion)
- 2026-05-05 Done — all ACs satisfied; `nx test landing-feature-home` + `nx build landing` clean
- 2026-05-05 Iteration: visual + plumbing fixes spilled out of original scope (kept here for traceability):
  - Section header — applied "Variant E" (mono rule row `04 · SELECTED · WORK ───` + sans bold heading + Newsreader italic deck). 5 prototypes preserved at `/ddl` for future reference.
  - Gallery — extracted shared `<landing-gallery>` (`libs/landing/shared/ui/components/gallery/`) with count-aware layouts (1/2/3/4); extended `<landing-figure>` with additive `[aspectRatio]` for cropped variant. Component bank doc at `.context/design/components/landing-gallery.md` with hidden content contract for authors.
  - Fallback rule revised — was `images.length < 4`, now `=== 0` (text-only fallback only when project has zero imagery; partial galleries render via the count-aware layouts). AC line 16 retains the old phrasing for history.
  - Link affordance — `<landing-link>` lead arrow always indigo at rest (project rule "no underlines" preserved); link family forced to mono for site-wide consistency.
  - Typography unification — selected-work used wrong font vars (`--landing-font-sans`/`--landing-font-serif` don't exist) and hardcoded `18px`. Switched to canonical tokens (`--landing-font-body` / `--landing-font-display` / `--landing-body-md` for desc, `--landing-display-md` for title).
  - SSR transfer cache enabled in `apps/landing/src/app/app.config.ts` (`withHttpTransferCacheOptions`) — eliminates the duplicate GET pattern on hydration that was poisoning the projects signal with cancelled-request `[]`.
  - BE plumbing surfaced by manual QA:
    - `/api/projects/featured` handler switched from `toListItem` → `toDetail` so the home can render in 1 round-trip (was list + N detail forkJoin).
    - `UpdateProjectBaseSchema` translatable fields → `PartialTranslatableSchema`; `Project.update()` merges per-locale via `mergeTranslatable()`. Patch `{ body: { en: 'X' } }` no longer rejects on missing `vi`.
    - Error code copy-paste bug fixed: `ValidationError(..., NOT_FOUND)` → `INVALID_INPUT` in 3 project commands and 5 blog-post commands/queries; `BlogPostErrorCode.INVALID_INPUT` enum value added; FE error dictionary entry added.
    - FE type alignment: `ProjectDetail` now matches BE — `links: ProjectLink[]` + `body`; deprecated `sourceUrl/projectUrl` fields removed (project-detail.html patched to derive from `links[]`).
  - DDL — fixed scroll-on-tab-switch (`router.navigate` → `Location.replaceState`); added heading prototypes section.
