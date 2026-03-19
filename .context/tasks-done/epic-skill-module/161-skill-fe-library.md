# Task: Skill Module - Frontend Admin Page

## Status: done

## Goal

Create Skill CRUD page in console app with category filter, parent skill selector, and hierarchy display.

## Context

More complex than Category FE page due to: SkillCategory dropdown, parent skill selector (only top-level skills), isLibrary toggle, additional metadata fields. Follows Category page patterns.

## Acceptance Criteria

- [x] Feature library created via `ng-lib` skill
- [x] Skill list page with table: name, category, parent, isLibrary, displayOrder
- [x] Category filter dropdown (TECHNICAL, TOOLS, ADDITIONAL)
- [x] Search by name
- [x] Pagination
- [x] Create form: name (required), category (required), description, parentSkill selector, isLibrary toggle, yearsOfExperience, iconUrl, proficiencyNote, isFeatured, displayOrder
- [x] Parent skill selector shows only top-level skills (no children)
- [x] Edit form pre-populated with existing values
- [x] Delete with confirmation dialog, shows warning if skill has children
- [x] Routing: `/skills`, `/skills/new`, `/skills/:id/edit`
- [x] Integrated into console sidebar navigation
- [x] Uses Angular Material components (console domain)

## Technical Notes

Parent skill selector: fetch skills where `parentSkillId IS NULL` for the dropdown. Exclude the skill being edited (prevent self-reference).

## Files to Touch

- libs/console/feature-skill/ (new library)
- apps/console/src/app/app.routes.ts
- Sidebar navigation update

## Dependencies

- 160-skill-module-wiring (BE must be complete)

## Complexity: L

Most complex admin page so far due to hierarchy UI and additional fields.

## Progress Log

- 2026-03-19: Created feature-skill library, skill service, skills page with table/filters/pagination, skill dialog with all fields, route + sidebar integration. Verified via Playwright.
