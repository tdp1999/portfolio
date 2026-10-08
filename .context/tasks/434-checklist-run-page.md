# Task: Run page (tick, skip, drag, notes, edit, filter, refs) + prod verify

## Status: pending

## Goal
At `/checklist/:id` the Owner works a run end to end, and it runs on production.

## Context
Epic `epic-landing-checklist`, the main surface. Rules CHK-001..005.

## Acceptance Criteria
- [ ] Clicking a row checkbox toggles todo/done; hovering a todo row shows a small × at the end; clicking × sets `skipped`, rendered differently from done, and progress counts it as complete (CHK-003).
- [ ] Dragging a task within or across phases persists the new order; dragging a group moves its children (CHK-005).
- [ ] Each row has a plain-text note that persists.
- [ ] The Owner can add a row (text only) to a phase, edit any row's text, and delete a row (a group delete removes its children after confirmation).
- [ ] Selecting a role filter dims rows whose doer and checker both differ from the role; no row leaves the list.
- [ ] Clicking `tra X` opens lookup section X; clicking `📁 §N` opens section N of the run's project; both in a read-only side panel with a "sửa ở `<file>`" hint.
- [ ] Every change autosaves (debounced); if the save returns 409, then the page shall show a reload prompt and stop autosaving.
- [ ] All changes survive a reload and show on a second device.
- [ ] Prod: `nx build landing` + `nx build api` green, deployed, `CHECKLIST_SYNC_TOKEN_HASH` set on Railway (prod token generated on the personal machine, stored in the password manager, never on the company machine), push run against prod, and `curl https://thunderphong.com/checklist` contains no run data.

## Technical Notes
- `@angular/cdk/drag-drop` with connected drop lists per phase; move whole group objects (children nested in the JSON) so CHK-005 holds by structure. Keyboard: up/down move buttons instead of keyboard drag.
- Row text = inline markdown rendered with `marked.parseInline` + sanitization; ref chips are parsed tokens, not regex on rendered HTML.
- No template method calls: row view models via computed signals.
- Read `.context/angular-style-guide.md`, `patterns-hotkeys.md` if adding shortcuts.
- Cut order if late (epic): side panel for project refs → role filter.

**Specialized Skill:** playwright-skill — verify interactions and both breakpoints on the running server (Owner starts it)

## Files to Touch
- libs/landing/feature-checklist/src/** (run page, autosave, drag, panel)

## Dependencies
- 429, 431, 432, 433

## Complexity: L

## Progress Log
