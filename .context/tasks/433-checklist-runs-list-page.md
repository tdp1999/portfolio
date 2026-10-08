# Task: Runs list + create run page

## Status: pending

## Goal
At `/checklist` the signed-in Owner sees runs and creates a run from a template and a project.

## Context
Epic `epic-landing-checklist`. Flow "Work a Checklist Run" step 1-2.

## Acceptance Criteria
- [ ] The list shall show active runs first, each with name, template title, project, progress (`done + skipped / total`) and last update.
- [ ] When the Owner submits name + template + project, the system shall create the run and navigate to `/checklist/:id`.
- [ ] If name, template or project is empty, then the form shall show the field error and shall not submit.
- [ ] The template picker shall list only non-archived templates (CHK-002); done and archived runs stay reachable under a separate toggle.
- [ ] The Owner can rename a run, set status done/archived, and delete a run after confirmation.
- [ ] Empty state shown when there are no runs.

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
