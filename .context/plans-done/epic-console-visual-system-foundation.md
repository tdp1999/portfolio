# Epic: Console Visual System Foundation

## Summary

Close the gap between the console's rich design documentation and its actual rendered UI quality. Despite having 50+ pages of research-backed foundations (tokens, typography, spacing scale) and a console design spec, the rendered console pages (profile being the reference case) suffer from flat visual hierarchy, low contrast between elements, and uniformly cramped spacing. Root cause analysis traced this to three structural gaps: (1) console-level docs are principle-heavy but lack an actionable spacing/typography cookbook with concrete decision rules; (2) three promised layout primitives (`console-long-form-layout`, `console-section-card`, `console-scrollspy-rail`) were specified but never built, forcing ad-hoc CSS in every page; (3) AI coding workflow was "blind" — no visual feedback loop, so output was written against logic rather than against what actually renders. This epic fixes all three: write the cookbook, build the primitives, and formalize a lightweight visual verification step using the Chrome DevTools MCP (`--slim` mode) that was added to the workflow on 2026-04-14.

## Why

- **Quality ceiling is too low.** 1-shot prompts on a blank canvas produce visually coherent UI from this same model; the same model inside our project produces cramped, low-contrast output. The constraint overhead is eating the visual-quality budget.
- **Every new console page repeats the same mistakes.** Without primitives, each page re-implements long-form layout, section cards, and scrollspy from scratch — hardcoded 12px gaps everywhere, inconsistent density, no hierarchy.
- **Docs are not load-bearing.** High-principle guidance ("follow the 8px grid", "maintain hierarchy") does not translate into a developer or AI picking the right value at the point of decision. The cookbook makes the decision trivial.
- **Visual blindness compounds.** Edits ship without being seen. Bugs that would be caught in one glance (low contrast, dead space, crammed fields) instead ship and are later rediscovered as user complaints.
- **Pragmatic timing.** The Profile module is the first non-trivial long-form console page. Getting this right now establishes the reference pattern before Experience, Projects, Blog, etc. replicate the same problems.

## Target Users

- **Site owner (admin):** Visibly better console UX — readable labels, clear section boundaries, comfortable field density.
- **AI coding assistant (future sessions):** Can reach for primitives and a cookbook instead of inventing spacing, and can verify output visually before reporting done.
- **Human devs (future):** Same benefit — concrete rules and components instead of having to re-read 50 pages of research.

## Scope

### In Scope

**1. Console Spacing & Typography Cookbook**

- New file: `.context/design/console-cookbook.md` (or append to `console.md` as a dedicated section).
- Concrete px values with decision matrix:
  - Icon-to-label gap: 8px
  - Form field vertical stacks: 12px
  - Label-to-field gap: 6-8px
  - Within a form group (related fields): 16px
  - Between form groups / subsections: 24px
  - Between major sections / cards: 32px
  - Between independent page regions: 48px
- Typography class decision table: when to use `text-page-title`, `text-section-heading`, `text-stat-label`, `text-body`, `text-caption` — with contrast and size expectations.
- Max-width rules: form column 640-720px, content column 800px.
- Contrast pairing table: which text token on which surface token (with measured WCAG ratios).
- Density modes: how Material density `-2` interacts with custom spacing (avoid double compression).

**2. Three Layout Primitives (the "to be built" components in `console.md`)**

- `console-long-form-layout` (in `libs/console/shared/ui/`): two-column layout with 30/70 split, 24px padding, 32px section gap, max-width enforcement. Slots: `description`, `content`. Handles sticky section-action footer.
- `console-section-card` (in `libs/console/shared/ui/`): card with 24px padding, 16px internal vertical rhythm, title + description header slot, content slot, optional footer actions slot. Baked-in border (no box-shadow per project rule). Matches `.text-section-heading` for title.
- `console-scrollspy-rail` (in `libs/console/shared/ui/`): 200-220px wide left rail, sticky, active section tracking, 8px vertical gap between items. Items are `[label, fragmentId]` inputs.

**3. Profile Page Refactor (Reference Implementation)**

- Rewrite `libs/console/feature-profile/src/lib/profile-page/profile-page.{html,scss}` using the three primitives.
- Remove all hardcoded px gap/padding values — use primitives + utility classes from the cookbook.
- Fix specific issues identified in the visual review (see `Risks & Warnings`):
  - Avatar area feels empty — needs better use of right column.
  - Contrast on labels too low.
  - Scrollspy rail text too small.
  - No visual separation between fields and surrounding section.

**4. Visual Feedback Workflow (Documented, Not Automated)**

- Document the Chrome DevTools MCP `--slim` workflow in `.context/design/visual-feedback.md` (or CLAUDE.md):
  - How to invoke (`mcp__chrome-devtools__navigate` + `screenshot`).
  - When to invoke (after non-trivial `.html` or `.scss` edits on console pages).
  - Dev login helper JS snippet for auth flow.
- **Not in scope:** auto-screenshot hooks (revisit after manual workflow is proven).

**5. Lint / Guardrail**

- Add a lightweight check (either ESLint rule, stylelint, or a simple grep in a script) that flags hardcoded px gap/padding values inside `libs/console/` `.scss` files when they should use primitives or Tailwind spacing utilities. Exceptions list allowed for non-grid values.

### Out of Scope

- Landing page visual system — already has its own polished primitives (`landing-*`).
- Backend changes of any kind.
- Redesigning profile *UX flow* (tabs, per-section save pattern) — that was settled in `epic-profile-per-section-refactor.md`; this epic is purely visual.
- Color palette changes — foundations tokens are fine; the issue is application, not the palette.
- Dashboard/overview pages — will be retrofitted in a follow-up epic once primitives are proven on profile.
- Automated visual regression (Percy/Chromatic) — separate, later decision.
- Angular CLI MCP, Figma MCP, or Glance MCP — stick with Chrome DevTools MCP for now; revisit other tools only if the workflow proves insufficient.

## High-Level Requirements

1. `.context/design/console-cookbook.md` (or equivalent section) exists with the full decision matrix, typography table, max-width rules, and contrast pairing table.
2. `console-long-form-layout`, `console-section-card`, `console-scrollspy-rail` components shipped in `libs/console/shared/ui/` with Storybook-free usage examples in their SCSS/TS comments and unit-test smoke coverage.
3. Profile page renders using only the primitives + cookbook utility classes — zero hardcoded px `gap`/`padding` values in `profile-page.scss` (verify by grep).
4. Profile page passes `design-check` skill review against the design bank.
5. Visual feedback workflow documented; at least one reference screenshot of the refactored profile page committed under `.context/design/bank/` as a "before/after" artefact.
6. Optional guardrail (lint or script) is in place or explicitly deferred with rationale.
7. WCAG AA contrast verified for all text on the refactored profile page (documented results, not asserted automatically — unless trivially scriptable).

## Technical Considerations

### Architecture

- **Lib boundary:** primitives live in `libs/console/shared/ui/` — the same lib that currently exports shared console UI bits. They must not import from `feature-*` libs.
- **Selector prefix:** `console-*` (new convention for console-only primitives, parallel to `landing-*` and generic `ui-*`). Update CLAUDE.md Component Domain Separation table once decided — or reuse `ui-*` if the team prefers cross-app reuse. **Open question to resolve during breakdown.**
- **Angular v21+ style:** signals, standalone, control flow syntax, `input()`/`output()` — per `angular-style-guide.md`.
- **SCSS:** tokens via CSS variables only; no hardcoded colors. Spacing values come from a shared SCSS partial (new) that maps cookbook decisions to variable names (e.g. `$gap-form-field: 12px`, `$gap-section: 32px`).
- **Tailwind interop:** prefer utility classes (`gap-3`, `p-6`) when they produce the same value as cookbook tokens; use custom SCSS only for component-internal structure.

### Dependencies

- No new runtime deps.
- Dev workflow depends on `chrome-devtools-mcp@latest` (already configured at user scope on 2026-04-14, `--slim` mode, viewport 1440x900).
- Relies on existing design docs in `.context/design/` as the source of truth for foundations tokens.

### Data Model

- None. This epic is purely presentational.

## Risks & Warnings

⚠️ **Ripple effect on future pages**
- Once primitives exist, every other console page (Experience, Projects, Blog, DDL workbench) becomes a candidate for refactor. Resist the urge to retrofit everything in this epic — profile page is the reference; other pages are a follow-up epic.

⚠️ **Selector-prefix decision is architectural**
- Choosing `console-*` vs `ui-*` for the three primitives locks a convention. Decide early in breakdown so later pages do not pick a different prefix.

⚠️ **Cookbook drift from foundations**
- If the cookbook duplicates values from `foundations.md` and they later change, the cookbook can go stale. Mitigation: the cookbook references token variable names (`$gap-section`), and the variables live in one SCSS partial; changing them cascades.

⚠️ **Visual workflow adds latency**
- Screenshot-verify for every edit is slow and token-spending. Guidance: only screenshot after non-trivial edits, not after every small tweak. The cookbook + primitives should already prevent most mistakes, reducing the need.

⚠️ **Material density `-2` + custom spacing = double compression**
- Known hazard in current profile page (fields already compact from Material, plus 12px custom gaps on top). Primitives must account for this — either opt out of `-2` inside section-card contexts, or size custom gaps assuming `-2` is active. Decide explicitly, do not re-discover.

⚠️ **"Decision matrix" can balloon into a style guide**
- Keep the cookbook actionable, not encyclopedic. Target: ~1 page of rules, ~1 page of tables. If it gets bigger, the AI/dev will not read it, and we are back where we started.

## Alternatives Considered

### Alternative 1: Fix profile page cosmetically without primitives

- **Pros:** Fastest path to a nicer-looking profile page.
- **Cons:** Does not address the root cause; every future page re-implements the same broken pattern; AI keeps inventing spacing values.
- **Why not chosen:** We have four more major modules coming (Experience, Projects, Blog, DDL). Fixing profile without primitives just means paying the refactor cost five times instead of once.

### Alternative 2: Adopt a third-party component library (PrimeNG, Taiga UI, Spartan)

- **Pros:** Primitives for free, proven design decisions, large community.
- **Cons:** Adds dependency and learning surface; conflicts with the existing Angular Material + custom token system; removes the distinctive look.
- **Why not chosen:** Material is already the chosen console system; the problem is not missing components, it is missing *our* composition primitives on top of Material.

### Alternative 3: Automate screenshot verification with a hook

- **Pros:** Guaranteed visual feedback on every change.
- **Cons:** Token-expensive; noisy on small edits; brittle across pages requiring auth.
- **Why not chosen for now:** Start with the manual workflow. Automate only if the manual pattern proves insufficient after a few sessions.

### Alternative 4: Merge this epic into a broader "Console v2" redesign

- **Pros:** Single coordinated effort.
- **Cons:** Scope explodes; blocks other work; easy to stall.
- **Why not chosen:** Keeping this narrow (docs + 3 primitives + profile refactor + workflow doc) makes it shippable in a defined time.

## Success Criteria

- [ ] `.context/design/console-cookbook.md` exists and is ≤3 pages total (rules + tables + examples).
- [ ] Three components exist in `libs/console/shared/ui/`, each with a usage example and a smoke test.
- [ ] Profile page passes `grep -E "gap:|padding:" libs/console/feature-profile/src/lib/profile-page/profile-page.scss` showing no hardcoded px values (only tokens or Tailwind classes).
- [ ] `design-check` run on profile page returns no critical findings.
- [ ] Before/after screenshots committed to `.context/design/bank/pr/` (or equivalent artefact folder) as visible evidence of the fix.
- [ ] Visual feedback workflow is documented in one file (CLAUDE.md or `.context/design/visual-feedback.md`).
- [ ] Zero WCAG AA violations on the refactored profile page for text contrast.
- [ ] A follow-up epic stub (or task) exists for retrofitting other console pages (Experience, Projects, etc.) so the work is not forgotten.

## Estimated Complexity

**L**

**Reasoning:** Three layout primitives to design, build, and test, each with non-trivial composition concerns (slots, sticky positioning, scrollspy logic, Material density interaction). A cookbook doc that has to be precise enough to be load-bearing. A profile page refactor that is a full visual rewrite, not a patch. Plus workflow docs and an optional lint. Not XL because scope is fenced (one page, not five; one lib, not a monorepo-wide change).

## Status

done

> All deliverables built under epic-profile-per-section-refactor (tasks 248–258). Primitives (LongFormLayout, ScrollspyRail, SectionCard, StickySaveBar), console-cookbook.md, visual-feedback.md, and profile page refactor all completed. Marked done 2026-04-20.

## Created

2026-04-14

## Context / Origin

Originated from session on 2026-04-14 where the user flagged poor visual quality on the rendered profile page despite extensive design documentation. Investigation identified three root causes (principle-heavy docs, missing primitives, no visual feedback). Same session installed Chrome DevTools MCP in `--slim` mode at user scope (`npx -y chrome-devtools-mcp@latest --slim --viewport 1440x900`) and verified the tool works end-to-end (navigate + login + screenshot of profile page). This epic captures the remaining work to close the quality gap.
