# Task: `/ddl/checklist` layout options for the run page

## Status: done

## Goal
The Owner picks one run-page layout from 2 to 3 live options in DDL before the real page is built.

## Context
Epic `epic-landing-checklist`. DDL is the source of truth for landing UI (CLAUDE.md). Visual language: landing. Present explorations live in `/ddl`, never in throwaway HTML.

## Acceptance Criteria
- [x] `/ddl/checklist` renders 2 to 3 layout options with real content from `checklist-lane-l.md` (fixture data, not lorem ipsum), switchable on the page.
- [x] Every option shows: phase heading with role, gate line, task row (checkbox, text, doer/checker chips, hover ×), group with `↳` children, done row, skipped row, row with a note, a `tra X` and a `📁 §N` chip, the side panel open, role filter with dimmed rows, per-phase progress.
- [x] Every option is checked at mobile and laptop breakpoints (screenshots).
- [x] The Owner's pick is recorded in this task's progress log; the DDL index links the page.

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
- 2026-10-09 Started. Using the design skill (research mode) for the options and playwright-skill for the self-check.
- 2026-10-09 Built the run-page pieces in `feature-checklist` (inline, task-row, group-row, phase-header, progress, ref-panel, role-filter) and `/ddl/checklist` with three options on one shared state: A Document (phase rail + document column), B Compact (collapsible phases, Do/Check as columns), C Focus (stepper, one phase, gate as callout). The phase board in the original idea was dropped: eight phases with sentence-long rows give columns under 280px (reason kept in the page's Notes). Fixture = real `checklist-lane-l.md` run through the API parser. `landing-checkbox` gained an additive `ariaLabel` input. DDL index entry added.
- 2026-10-09 Playwright self-check at 375px and 1440px (stage and Full width overlay), all three options: no page errors, no horizontal overflow; tick, skip ×, role filter (38 of 46 rows dimmed for Manager), ref chip open/close, compact collapse and focus next all work. Fixes from the check: compact Do/Check columns now follow a container query (800px) instead of the viewport, since beside the panel a laptop viewport left the text column one word wide; phase header number + role moved into an eyebrow so the name lines up with the rows; role chips no longer break inside a label and wrap from tablet up; ref-panel markdown styles now reach the `[innerHTML]` output via scoped `::ng-deep`.
- 2026-10-09 Note for 434: on mobile the open panel is a bottom sheet covering 60% of the viewport; the real page should open it only on a chip tap.
- 2026-10-09 Owner picked **B · Compact**. A and C removed from the page (reasons kept in its Notes). Owner's follow-up changes, applied and re-checked with Playwright at 375 / 1440 / 1680 / 1920:
  - Blog-style frame: run column centred at the landing container width (72rem). The reference panel is closed by default, opens on a ref chip, and from laptop joins the column as a centred pair (panel `clamp(360px, 32%, 520px)`), its card sticky at the vertical middle of the viewport; bottom sheet below laptop. A margin-only panel (blog ToC spot) was tried first and dropped: beside 72rem even 1920px leaves under 400px, too narrow for the lookup tables.
  - No `↳`: a group shows its title with a child count, children indented behind a vertical guide line.
  - Skip: × leaves the checkbox empty and strikes the text; an undo icon (`undo-2`, added to the lucide provider) returns the row to todo. Added to task 434's AC.
  - Role filter: a `landing-select` dropdown (All roles + 8 roles, each with its task count) instead of a chip per role.
  - Fewer dividers: no rules between compact rows or phases (spacing + hover wash); Do/Check columns widened to 200/240px, container query threshold 880px.
  - Row controls centred on the first text line (checkbox, Do/Check, × share one centre).
- 2026-10-09 Done, all ACs satisfied.
- 2026-10-09 Second round of Owner feedback, applied and measured with Playwright at 1680 (centres within 1px):
  - Rows: ref chip fixed at 16px and middle-aligned so it no longer stretches the line; checkbox, text, chip and action share one centre. Phase header: toggle is one name line tall and the titles centre instead of baseline-align, so toggle, number, name, role and progress share one centre.
  - Inline text: plain segments wrapped in `ng-container` so template line breaks no longer put a space before punctuation ("nào : ở đâu").
  - Dividers back where they mark structure: a hairline between phases and under the column caption; still none between rows.
  - Icon-only tools with tooltips: expand/collapse all beside the run progress bar; check all (todo → done) and uncheck all (done → todo) per phase, beside each phase's progress bar (Owner: bulk check belongs to a section, not the run). Skipped rows untouched, each tool disabled when nothing would move. New util `withPhaseTasksState` (+ spec). Task 434 should add a confirm step for the bulk moves.
  - `landing-select` gained `sublabelAlign="end"` (count pushed right) and a `--landing-select-panel-min-width` hook; the role filter uses both.
  - Landing-wide contrast raised (palette text tiers 300 to 600, both themes); DESIGN-landing.md updated.
  - Reference panel behaviour reopened. Rail + dock (always-present outline rail, bottom dock with full-screen toggle) was built, then dropped by the Owner: the outline pulled focus. Final: the run is a 72rem column centred by its left gutter (`max(container-padding, (100cqw - 72rem) / 2)`); a ref opens, on a frame of 1280px and up, a panel taking the space right of the run (`clamp(400px, 30cqw, 640px)`) while the run keeps its left edge and narrows from the right (shift accepted); below 1280px, a centred popup over the page (backdrop click or Escape closes; Escape stops at the ref so the DDL stage stays expanded). Measured at 1920 / 1680 / 1440 / 1280 / 1024 / 375: left edge unchanged on open, no horizontal overflow. At 1440 the narrowed run (792px) stacks Do/Check under the text.
  - Per-phase check/uncheck moved from the run toolbar (Owner: bulk check belongs to a section).
  - Tablet/mobile: head regrid (title line, then bar + tools + filter), phase header drops its bar under the name in a column under 600px, rows unindented on phones, ref tables scroll sideways (cell floor 6rem) instead of squeezing.
  - Lesson from the outline attempt: a BEM block named `.outline` collides with Tailwind's `outline` utility (it drew a box around the ToC).
- 2026-10-09 (task 434) The frame moved into `landing-checklist-board`; `/ddl/checklist` renders that board on a local body, so the showcase is the run page itself. Phase "Check all" tooltip end-aligned (it overflowed at 375).
