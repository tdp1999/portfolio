# Task: Console project CRUD page

## Status: done

## Goal
Create the console admin page for managing projects — list table with filters, and create/edit dialog with all form sections.

## Context
Most complex console form so far — 6 sections including dynamic arrays for technical highlights and image gallery. Follow existing patterns from Skill and Media features. This is an Angular library created via `/ng-lib` skill.

## Acceptance Criteria

### Library Setup
- [x] New Nx library: `libs/console/feature-project/` with correct tags (scope:console, type:feature)
- [x] Routes registered in console app routing (lazy loaded)
- [x] Sidebar navigation updated with "Projects" link

### List Page
- [x] Angular Material table: thumbnail (small), title, status badge, featured star, startDate, actions
- [x] Search by title
- [x] Status filter tabs: All | Published | Draft
- [x] Trash tab for soft-deleted items (restore / permanent delete)
- [x] Create button opens dialog
- [x] Edit action opens dialog with existing data
- [x] Delete action with confirmation dialog

### Create/Edit Dialog
- [x] Section 1 — Basic Info: title, oneLiner (en/vi inputs), startDate (datepicker), endDate (datepicker, optional)
- [x] Section 2 — Story: motivation (en/vi textarea), description (en/vi textarea), role (en/vi textarea)
- [x] Section 3 — Technical Highlights: dynamic array (add/remove), max 4 items, each item: challenge (en/vi), approach (en/vi), outcome (en/vi), codeUrl (optional)
- [x] Section 4 — Media: thumbnail upload (single, via Media module), gallery images (multi-upload + reorder with up/down arrows)
- [x] Section 5 — Details: sourceUrl, projectUrl, skills multi-select (from Skill module API)
- [x] Section 6 — Publishing: status toggle (draft/published), featured toggle, displayOrder number input
- [x] Form validation with error display
- [x] Save with success/error feedback (snackbar)

### Service
- [x] `ProjectService` with HTTP methods: list, getById, create, update, delete, restore, reorder
- [x] Types file for local response/request interfaces

## Technical Notes
- Follow Skill feature pattern: `libs/console/feature-skill/src/lib/`
- Follow Media feature for image upload pattern: `libs/console/feature-media/src/lib/`
- Use Angular Reactive Forms with FormBuilder
- Dynamic array: `FormArray` for highlights — add/remove controls
- Image reorder: simple up/down arrow buttons (not drag-and-drop)
- Skills multi-select: fetch from Skill API, use MatSelect with multiple
- Translatable inputs: pair of inputs labeled "EN" / "VI" — reuse pattern from other modules if exists

**Specialized Skill:** ng-lib — use for library creation with correct Nx tags and configuration.

## Files to Touch
- libs/console/feature-project/ (new library)
  - src/lib/projects-page/ (list component)
  - src/lib/project-dialog/ (create/edit dialog)
  - src/lib/project.routes.ts
  - src/lib/project.service.ts
  - src/lib/project.types.ts
- apps/console/src/app/app.routes.ts (add project route)
- Console sidebar component (add Projects nav item)

## Dependencies
- 231 - API endpoints must be available

## Complexity: XL
- Most complex console form: 6 sections, dynamic arrays, image gallery, multi-select

## Progress Log
- [2026-04-05] Started — all phases implemented in single pass
- [2026-04-05] Phase 0: Extracted MediaService + types to console/shared/data-access (re-exports in feature-media)
- [2026-04-05] Phase 1a: Created TranslatableInputComponent (CVA, configurable languages)
- [2026-04-05] Phase 1b: Created MediaPickerDialog (single/multi mode, shared component)
- [2026-04-05] Phase 2: Generated feature-project library via nx generator
- [2026-04-05] Phase 3: Created ProjectService + types matching API contract
- [2026-04-05] Phase 4: Created list page with mat-tabs (All/Published/Draft/Trash), table, search, pagination
- [2026-04-05] Phase 5: Created 6-section dialog with FormArray highlights, media picker, skill multi-select
- [2026-04-05] Phase 6: Registered route + sidebar nav
- [2026-04-05] TypeScript compile: clean (exit 0)
- [2026-04-05] Done — all ACs satisfied
