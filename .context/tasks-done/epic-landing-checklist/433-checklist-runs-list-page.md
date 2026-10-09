# Task: Runs list + create run page

## Status: done

## Goal
At `/checklist` the signed-in Owner sees runs and creates a run from a template and a project.

## Context
Epic `epic-landing-checklist`. Flow "Work a Checklist Run" step 1-2.

## Acceptance Criteria
- [x] The list shall show active runs first, each with name, template title, project, progress (`done + skipped / total`) and last update.
- [x] When the Owner submits name + template + project, the system shall create the run and navigate to `/checklist/:id`.
- [x] If name, template or project is empty, then the form shall show the field error and shall not submit.
- [x] The template picker shall list only non-archived templates (CHK-002); done and archived runs stay reachable under a separate toggle.
- [x] The Owner can rename a run, set status done/archived, and delete a run after confirmation.
- [x] Empty state shown when there are no runs.

## Technical Notes
- Data service in `libs/landing/feature-checklist` (signals; no transfer cache since client-only).
- Layout follows the option chosen in task 432.

## Files to Touch
- libs/landing/feature-checklist/src/** (list page, create form, data service)

## Dependencies
- 429 - runs API
- 431 - auth + route
- 432 - chosen layout

## Complexity: S

## Progress Log
- 2026-10-09 Started
- 2026-10-09 `ChecklistService` (all run/doc calls), `checklist-run.form` (reactive form, `landing-select` pickers fed by `listDocs`, so archived templates never appear), `checklist-run.row` (inline rename, done/reopen, archive/unarchive, delete with inline confirm), list page with active runs, a toggle for done and archived, empty state. Private shell no longer wraps pages in a container: each private page owns its frame.
- 2026-10-09 Fixed: rename `<form>` had no `[formGroup]`, so Enter did a native submit and reloaded the page; now a `FormGroup` gives it `ngSubmit`.
- 2026-10-09 Fixed: the real list showed "Could not load the runs": `ChecklistService` was `providedIn: 'root'` and got the app's plain HttpClient (no token, every call 401). It is now provided on `CHECKLIST_ROUTES`, under the private group's token-carrying HttpClient. The mock API in the browser check now answers 401 without the bearer token, so this cannot slip through again.
- 2026-10-09 Verified on the built SSR with a mocked API (Playwright, 1440 and 375): list order and fields, toggle, empty-submit errors with no POST, live-only template picker, create posts the trimmed input and navigates, rename / done / delete with confirm, empty state, no horizontal overflow at 375, zero unauthenticated calls.
- 2026-10-09 Done, all ACs satisfied (live check against the real API pending the Owner's dev server restart)
- 2026-10-09 Owner UI feedback: the empty state lost its New run button (the header one stays); the form moved into a `<dialog>` (`checklist-run.create-dialog`, fresh form on every open, Escape / backdrop cancel unless submitting, overflow visible so select panels are not clipped); compact fields (`landing-input size="sm"`, `landing-select appearance="field"` spanning the field); no slug sublabel on project options; the name hint became the placeholder. Shared fix: `landing-form-field` hint and error now inherit body-sm (the base `p` size used to win). Verified on the built SSR at 1440 and 375.
