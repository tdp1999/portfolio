# Epic: Console UX Critical Bugs

## Summary

Fix three blocking-quality bugs surfaced during manual testing that affect every form across the console. Bundled because all are CSS/UX-layer regressions and share the same surface (Material form fields + form pages).

## Why

- **Translatable Input two-column textarea** — column B follows column A's height as a flex stretch but does not gain rows; user can also drag column B *below* 1 row, making it unfillable. Discovered while editing translatable content.
- **Placeholder vs filled-text indistinguishable in dark theme** — "Company URL" with placeholder `https://...` looks identical in weight/color to filled text in the field above. Material's default placeholder opacity is overridden somewhere; needs to be brought back to spec.
- **Save button hidden until form valid** — on Create Experience, after filling required fields the Save button still does not appear. Behavior is wrong: user cannot click Save to *trigger* validation feedback. Save must always be visible; invalid → disabled with reason.

## Target Users

- Site owner editing any console form (every CRUD page).

## Scope

### In Scope

- Fix two-column textarea so each column resizes independently (rows, not flex height) and cannot shrink below configured min-rows.
- Fix dark-theme placeholder color to match Material spec (≈ `mat-form-field-state-layer-color` at standard opacity), restoring contrast vs filled text.
- Audit all form pages: Save / Submit button must always render. Disabled when form invalid; click-while-disabled (or hover) reveals first invalid field — implementation choice deferred to executor.
- Apply globally across any console form using translatable input, Material form fields, or save buttons.

### Out of Scope

- Redesigning the save button itself (color, position) — only visibility/disabled rules.
- Light-theme placeholder color (only dark-theme broken — verify and confirm).

## High-Level Requirements

1. In Translatable Input, dragging textarea A does not change textarea B's row count or height.
2. Both columns of Translatable Input enforce `min-rows ≥ 1`; user cannot drag below it.
3. In dark theme, placeholder text is visibly lighter / lower-contrast than filled text on every Material input across console (spot-check Experience, Profile, Project, Blog, Skill, Category forms).
4. On Create Experience (and every other create/edit form), Save / Submit button is rendered from first paint, regardless of form validity.
5. Clicking Save on an invalid form surfaces validation errors (existing behavior preserved); disabled state, if used, must still allow user to discover *why*.

## Technical Considerations

### Files / Areas Likely Touched

- Translatable Input component (under `libs/console/shared/` or `libs/shared/ui` — confirm at implementation time).
- Global SCSS / Material theme overrides (likely `apps/console/src/styles*` and design-system layer).
- Every `*-form-page` in `libs/console/feature-*` (audit only — most likely no per-page change needed for save button if a shared form-page pattern exists).

## Risks & Warnings

⚠️ **Theme override surface area**
- Placeholder color may be set in multiple SCSS layers (Material theme, design tokens, component-local).
- Single-source-of-truth fix preferred over patching one selector.

⚠️ **Save-button "fix" might unmask other bugs**
- Once always-visible, validation messaging gaps will become user-visible.
- Acceptable, but flag any new issues.

## Success Criteria

- [ ] All five high-level requirements verified by manual walkthrough on dark theme.
- [ ] No regressions on existing form flows (validation, submit, dirty-tracking).
- [ ] `npx tsc --noEmit` passes for affected projects.

## Estimated Complexity

M

**Reasoning:** Three tactical fixes; placeholder fix may have wider blast radius than expected if the override is layered.

## Status

done

## Created

2026-04-27
