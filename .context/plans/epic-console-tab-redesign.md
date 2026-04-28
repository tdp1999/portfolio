# Epic: Console Tab Component Redesign

## Summary

The current tab component spans the full container width and feels wrong to the user. This epic does the UI/UX research, picks a direction, and applies it system-wide. Split out from earlier epics because it requires research and a design pass before any code change.

## Why

- User dislikes tabs being stretched to full container width.
- "Redesign" direction is undecided — could be: shrink-to-fit content width, segmented control look, sidebar-tabs, vertical-tabs, or replacement with another nav pattern entirely.
- Tabs appear in multiple places across console; a single change has broad reach — research must come first.

## Target Users

- Site owner navigating console pages with tabbed sections.

## Scope

### In Scope

- Audit: list every place the tab component is used across console.
- Research: industry patterns for tabs at form-section level vs page-level (Material 3, Carbon, Atlassian, Polaris, Radix). Document tradeoffs.
- Decide: visual + behavioral spec (width strategy, alignment, indicator style, mobile behavior).
- Update design system docs.
- Migrate all tab usages.

### Out of Scope

- Replacing tabs with a different nav pattern entirely (e.g., accordion) — only redesign within "tabs" as a concept. If research recommends replacement, surface as a separate decision.

## High-Level Requirements

1. Tab usage inventory written (file paths + screenshots).
2. Research note in `.context/design/bank/` referencing 3+ industry sources, written via `design-ingest` skill.
3. Decision logged in `.context/decisions.md`.
4. Design system updated (`.context/design/`) with the new tab spec.
5. All audited tab usages migrated.
6. Visual regression sanity-check on desktop + mobile.

## Technical Considerations

### Architecture

- Tabs likely use Angular Material `mat-tab-group`; redesign is mostly theming + component-wrapper if needed.
- If a custom wrapper is needed, place under `libs/console/shared/ui` or `libs/shared/ui`.

### Dependencies

- None (parallel to all other epics).

## Risks & Warnings

⚠️ **Research drift**
- Easy to spend a week on tab philosophy. Box research at 1–2 hours, decide, move on.

⚠️ **Migration breadth unknown**
- Depends on inventory. If usage is heavy, may need to split this epic further.

## Success Criteria

- [ ] All six high-level requirements met.
- [ ] User confirms new tabs no longer feel wrong.
- [ ] No regressions in tabbed page behavior (active state, deep-linking, mobile scroll).

## Specialized Skills

- **design-ingest** — capture industry research into `.context/design/bank/`
- **design-check** — validate migrated tab usages against the new spec

## Estimated Complexity

M

**Reasoning:** Research bounded, but migration breadth is unknown until audit completes. Could expand to L if usage is heavy.

## Status

ready

## Created

2026-04-27
