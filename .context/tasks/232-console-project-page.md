# Task: Console project CRUD page

## Status: pending

## Goal
Create the console admin page for managing projects — list table with filters, and create/edit dialog with all form sections.

## Context
Most complex console form so far — 6 sections including dynamic arrays for technical highlights and image gallery. Follow existing patterns from Skill and Media features. This is an Angular library created via `/ng-lib` skill.

## Acceptance Criteria

### Library Setup
- [ ] New Nx library: `libs/console/feature-project/` with correct tags (scope:console, type:feature)
- [ ] Routes registered in console app routing (lazy loaded)
- [ ] Sidebar navigation updated with "Projects" link

### List Page
- [ ] Angular Material table: thumbnail (small), title, status badge, featured star, startDate, actions
- [ ] Search by title
- [ ] Status filter tabs: All | Published | Draft
- [ ] Trash tab for soft-deleted items (restore / permanent delete)
- [ ] Create button opens dialog
- [ ] Edit action opens dialog with existing data
- [ ] Delete action with confirmation dialog

### Create/Edit Dialog
- [ ] Section 1 — Basic Info: title, oneLiner (en/vi inputs), startDate (datepicker), endDate (datepicker, optional)
- [ ] Section 2 — Story: motivation (en/vi textarea), description (en/vi textarea), role (en/vi textarea)
- [ ] Section 3 — Technical Highlights: dynamic array (add/remove), max 4 items, each item: challenge (en/vi), approach (en/vi), outcome (en/vi), codeUrl (optional)
- [ ] Section 4 — Media: thumbnail upload (single, via Media module), gallery images (multi-upload + reorder with up/down arrows)
- [ ] Section 5 — Details: sourceUrl, projectUrl, skills multi-select (from Skill module API)
- [ ] Section 6 — Publishing: status toggle (draft/published), featured toggle, displayOrder number input
- [ ] Form validation with error display
- [ ] Save with success/error feedback (snackbar)

### Service
- [ ] `ProjectService` with HTTP methods: list, getById, create, update, delete, restore, reorder
- [ ] Types file for local response/request interfaces

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
