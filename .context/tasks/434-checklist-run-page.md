# Task: Run page (tick, skip, drag, notes, edit, filter, refs) + prod verify

## Status: in-progress

## Goal
At `/checklist/:id` the Owner works a run end to end, and it runs on production.

## Context
Epic `epic-landing-checklist`, the main surface. Rules CHK-001..005.

## Acceptance Criteria
- [x] Clicking a row checkbox toggles todo/done; hovering a todo row shows a small × at the end; clicking × sets `skipped`, rendered differently from done (checkbox stays empty, text struck through), and progress counts it as complete (CHK-003); a skipped row shows an undo icon in the × slot that returns it to `todo`.
- [x] Dragging a task within or across phases persists the new order; dragging a group moves its children (CHK-005).
- [x] Each row has a plain-text note that persists.
- [x] The Owner can add a row (text only) to a phase, edit any row's text, and delete a row (a group delete removes its children after confirmation).
- [x] Selecting a role filter dims rows whose doer and checker both differ from the role; no row leaves the list.
- [x] Clicking `tra X` opens lookup section X; clicking `📁 §N` opens section N of the run's project; both in a read-only side panel with a "sửa ở `<file>`" hint.
- [x] Every change autosaves (debounced); if the save returns 409, then the page shall show a reload prompt and stop autosaving.
- [x] All changes survive a reload and show on a second device.
- [ ] Prod: `nx build landing` + `nx build api` green, deployed, `CHECKLIST_SYNC_TOKEN_HASH` set on Railway (prod token stored in the password manager; generated on the company machine by the Owner's decision of 2026-10-09), push run against prod, and `curl https://thunderphong.com/checklist` contains no run data.

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
- 2026-10-09 Started
- 2026-10-09 Built `checklist.board` (the Compact frame from task 432, moved out of the DDL page): phases, role filter, ref panel / popup, plus edit mode (pen in the run toolbar) for drag (`@angular/cdk/drag-drop`, one drop list per phase, groups carry children), keyboard move (↑ / ↓ on the focused handle, crossing phase edges), edit text, add task per phase, delete. Notes are always on (they are part of working a run). Deleting a row or a group and phase check / uncheck all go through `checklist.confirm-dialog` (native `<dialog>`). `/ddl/checklist` now renders the same board on a local body.
- 2026-10-09 `checklist-run.detail` at `/checklist/:id`: loads the run, the lookup (`bang-tra`) and the run's project; autosave = 800 ms debounce, one save at a time carrying the last returned version; 409 shows a pinned "Reload run" prompt, stops saving and locks the board (`inert`); other errors keep the edit and offer "Try again"; leaving within the pause sends the last edit; `beforeunload` warns while unsaved.
- 2026-10-09 Ref panel hint is in English like the rest of the page chrome: "Edit in `bang-tra.md`" / "Edit in `projects/<slug>.md`" (the AC's "sửa ở `<file>`").
- 2026-10-09 Pure body edits in `checklist.util.ts` (`withRowText` re-reads refs, `withRowNote`, `withoutRow`, `withNewTask`, `withMovedRow`, `withShiftedRow`, `findRow`) with 5 new specs (14 total). `landing-textarea` gained an additive `ariaLabel` input.
- 2026-10-09 Verified on the built SSR with a mocked API that requires the bearer token (Playwright, 1440 and 375): tick / skip / undo, note, role filter dims 5 of 6 and removes none, both ref kinds with file hint, Escape, edit text, add, delete with confirm, keyboard move, mouse drag of a group across phases, group delete count + cancel, phase check-all with confirm, changes back after reload, 409 prompt + lock + reload with no extra save, no horizontal overflow at 375 in edit mode, popup inside the viewport. `/ddl/checklist` layout re-measured at 6 widths, same as before.
- 2026-10-09 Still open: "survive a reload and show on a second device" needs the real API (Owner restarts the dev servers, then a check from a second browser); the Prod AC needs the Owner (deploy, Railway `CHECKLIST_SYNC_TOKEN_HASH`, token from the personal machine).
- 2026-10-09 Owner restarted the dev servers and confirmed the live list and the reload / second-device check.
- 2026-10-09 Owner chose to generate the prod sync token on the company machine (overrides the old "personal machine only" rule). Token generated with `openssl rand -hex 32`; its SHA-256 set as `CHECKLIST_SYNC_TOKEN_HASH` on Railway service "Dashboard API" (production) with deploys skipped, so the next deploy picks it up. Remaining for the Prod AC: commit + deploy landing and api, `pnpm checklist:push` against prod, `curl https://thunderphong.com/checklist` shows no run data.
- 2026-10-09 Owner UI feedback: run progress moved right, its right edge matches the phase bars (also below 600px); group, child and task note icons share one x; save text replaced by a state icon (cloud-check / upload / spinner / alert / off) with a tooltip and an sr-only status; template and project shown as icon chips; edit mode works on a draft (Cancel reverts, Save writes once, beforeunload while dirty), opens every phase, hides phase toggles and run / phase tools, sticky Cancel / Save bar; ref panel text at body-sm like the rows. Dark-mode flash on opening a note: not reproduced (screencast frames on the dev server and the build, OS light + site dark, before and after); added `color-scheme` to the theme roots so native control parts follow the site theme. Verified on the built SSR at 1440 and 375.
