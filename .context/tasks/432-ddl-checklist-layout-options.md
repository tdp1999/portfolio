# Task: `/ddl/checklist` layout options for the run page

## Status: pending

## Goal
The Owner picks one run-page layout from 2 to 3 live options in DDL before the real page is built.

## Context
Epic `epic-landing-checklist`. DDL is the source of truth for landing UI (CLAUDE.md). Visual language: landing. Present explorations live in `/ddl`, never in throwaway HTML.

## Acceptance Criteria
- [ ] `/ddl/checklist` renders 2 to 3 layout options with real content from `checklist-lane-l.md` (fixture data, not lorem ipsum), switchable on the page.
- [ ] Every option shows: phase heading with role, gate line, task row (checkbox, text, doer/checker chips, hover ×), group with `↳` children, done row, skipped row, row with a note, a `tra X` and a `📁 §N` chip, the side panel open, role filter with dimmed rows, per-phase progress.
- [ ] Every option is checked at mobile and laptop breakpoints (screenshots).
- [ ] The Owner's pick is recorded in this task's progress log; the DDL index links the page.

## Technical Notes
- Candidate directions: (a) editorial document (single column, phases as chapters, sticky phase progress rail); (b) compact list (Things/Linear density, phases collapsible); (c) phase board (columns per phase, horizontal on laptop).
- `landing-*` components and landing typography scale only; responsive mixins; 4px grid. Read `taste/` + `.context/design/contracts/` first.
- Build the row/phase pieces as the real components inside `libs/landing/feature-checklist` so task 434 reuses them, with DDL feeding fixture data.

**Specialized Skill:** design — option exploration + taste pass
**Specialized Skill:** playwright-skill — screenshots per breakpoint

## Files to Touch
- apps/landing/src/app/pages/ddl/ddl-checklist/** (new) + DDL routes/index
- libs/landing/feature-checklist/src/** (row, phase, chip, panel components)

## Dependencies
- 429 - shared run-body types (can start with the types alone)

## Complexity: M

## Progress Log
