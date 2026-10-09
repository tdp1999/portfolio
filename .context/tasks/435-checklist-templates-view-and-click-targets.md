# Task: Checklist template views and checkbox-like click targets

## Status: done

## Goal

The Owner can browse the templates a run starts from, read only, and works a run with the click targets a native checkbox and a fold header give.

## Context

Owner feedback after using the checklist (epic `epic-landing-checklist`, completed 2026-10-09). Standalone follow-up. The templates were only visible as names in the New run dialog; the run page imitated a checkbox without the label click, and folded phases only from the chevron.

## Acceptance Criteria

- [x] `/checklist/templates` lists the live templates (title, file, last update), each opening `/checklist/templates/:slug`; an archived template is not listed (CHK-002), an empty list shows an empty state.
- [x] `/checklist/templates/:slug` shows the template on the run board in view-only mode: no progress, no checkbox, no note / skip / edit, no group counts; folding, the role filter and lookup refs work; a project ref explains it waits for a run's project; an unknown slug shows "Template not found".
- [x] The runs list links to the templates; the run page's template chip opens its template.
- [x] On a run, a click on a row's text ticks or unticks it like its checkbox; a click on a ref inside the text only opens the ref; a click that ends a text selection changes nothing.
- [x] A click on a phase's title line folds or opens the phase (run and template view), except in edit mode; a click on a ref in that line only opens the ref.
- [x] `/ddl/checklist` shows the template view and documents the click targets.

## Technical Notes

- Board input `viewOnly`; task row, group row and phase header carry it down. The empty check slot keeps the columns aligned.
- Row text is a `<label for>` of the checkbox's native input (unique id per row); interactive descendants (ref buttons) never activate a label.
- Phase header emits `titleToggle`; the board maps it to `toggleCollapsed`, `foldable` is off in edit mode.

## Files to Touch

- libs/landing/feature-checklist/src/lib/checklist-template.list/*
- libs/landing/feature-checklist/src/lib/checklist-template.detail/*
- libs/landing/feature-checklist/src/lib/checklist.routes.ts
- libs/landing/feature-checklist/src/lib/checklist.board/*
- libs/landing/feature-checklist/src/lib/checklist.task-row/*
- libs/landing/feature-checklist/src/lib/checklist.group-row/*
- libs/landing/feature-checklist/src/lib/checklist.phase-header/*
- libs/landing/feature-checklist/src/lib/checklist.ref-panel/*
- libs/landing/feature-checklist/src/lib/checklist-run.list/*
- libs/landing/feature-checklist/src/lib/checklist-run.detail/*
- apps/landing/src/app/pages/ddl/ddl-checklist/*

## Dependencies

- 429-434 (done)

## Complexity: M

## Verification: full

## Progress Log

- 2026-10-09 Started from Owner feedback: template list + read-only view, label click on rows, title click folds phases.
- 2026-10-09 Built: board `viewOnly` (task row, group row, phase header carry it; empty check slot 30px = checkbox box 18px + its 12px label gap, so text stays at the run's x), template list + detail pages, routes before `:id`, Templates link on the runs list, template chip on the run page links to its template, ref panel says a template's project refs wait for a run's project. Row text is the checkbox's `<label for>`; a click ending a text selection is cancelled. Phase title line emits `titleToggle` (off in edit mode). DDL `/ddl/checklist` gained a Template view section and a Click targets note.
- 2026-10-09 Verified on the built SSR with a mocked API (Playwright, 1440 and 375, dark): 44 checks for this task, plus the earlier suites (header and sign-in 24, run page feedback 58, review fixes 12) all green; feature-checklist lint clean, 14 unit tests pass, `nx build landing` green.
- 2026-10-09 Pre-commit review: two boards on `/ddl/checklist` shared element ids (phase sections, phase bodies, grip help, confirm heading); ids now carry a per-instance prefix, re-checked: no duplicate ids, every chevron's `aria-controls` points inside its own board.
- 2026-10-09 Done, all ACs satisfied
