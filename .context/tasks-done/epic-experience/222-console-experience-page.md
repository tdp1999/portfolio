# Task: Console experience management page

## Status: done

## Goal
Build the Angular console page for managing work history — list view with table and create/edit dialog with multi-section form including translatable inputs, skills multi-select, date pickers, and company logo upload.

## Context
Experience console page follows the Skill page pattern (list + dialog) but is more complex due to: 4 translatable JSON fields (en/vi inputs), dynamic achievements array, skills multi-select, company logo upload, and date pickers with "current position" toggle. This is the second console form with translatable fields (after Profile settings).

## Acceptance Criteria

### Feature Library Setup
- [x] Create `libs/console/feature-experience/` library (use `ng-lib` skill)
- [x] Route: `/experiences` in console app routes
- [x] Lazy-loaded, sidebar nav link added under Admin section
- [x] Loads experience list on init

### List Page (experiences-page)
- [x] Angular Material table with columns: company name, position (en), employment type badge, location type badge, date range, actions
- [x] Pagination (standard page/limit)
- [x] Search input (searches across companyName, position)
- [x] Row actions: Edit (opens dialog), Delete (soft delete with confirm), Restore (if deleted)
- [x] "Add Experience" button opens create dialog
- [x] Empty state when no experiences exist
- [x] Date range display: "Jan 2023 – Present" or "Mar 2021 – Dec 2022"
- [x] Employment type and location type shown as small badges/chips

### Create/Edit Dialog (experience-dialog)
- [x] Multi-section form:

**Company Section:**
- [x] companyName (text input, required)
- [x] companyUrl (URL input, optional)
- [x] Company logo upload (uses existing Media upload pattern, shows preview, clear button)

**Role Section:**
- [x] position: bilingual inputs (en + vi, required)
- [x] description: bilingual textareas (en + vi, optional)
- [x] employmentType: Material select dropdown
- [x] teamRole: bilingual inputs (en + vi, optional)

**Dates Section:**
- [x] startDate: Material date picker (required)
- [x] endDate: Material date picker (optional)
- [x] "Current position" checkbox — when checked, endDate is disabled and set to null

**Location Section:**
- [x] locationType: Material select dropdown (REMOTE, HYBRID, ONSITE)
- [x] locationCountry, locationCity (text inputs)
- [x] locationPostalCode, locationAddress1, locationAddress2 (text inputs, optional)

**Skills Section:**
- [x] Multi-select from existing skills (Material autocomplete with chips, or checkbox list)
- [x] Fetches available skills from Skill API
- [x] Selected skills shown as removable chips

**Achievements Section:**
- [x] Tab or toggle for EN / VI
- [x] Dynamic array per language: add/remove achievement bullet points
- [x] Each bullet is a text input with remove button
- [x] "Add Achievement" button per language tab

**Context Section (optional/collapsible):**
- [x] clientName, clientIndustry, domain (text inputs)
- [x] teamSize (number input)

**Display Section:**
- [x] displayOrder (number input, default 0)

### Form Behaviour
- [x] Create mode: empty form, save dispatches POST
- [x] Edit mode: prefilled with existing data, save dispatches PUT
- [x] Save button: disabled until form valid
- [x] Success toast after save, refreshes list
- [x] Error handling: field-level validation messages

**Specialized Skill:** ng-lib — use for creating the feature library with correct tags/directory/importPath.

## Technical Notes
- Use Angular reactive forms (FormGroup, FormArray for achievements)
- Bilingual inputs: simplest approach = two inputs per translatable field (en label + vi label). Reuse pattern from Profile settings page (task 212) if available.
- Skills multi-select: fetch all skills on dialog open, display as autocomplete chips
- Company logo: same pattern as Profile avatar upload — call Media upload → get Media ID → set on form
- Date display in table: format with `DatePipe` as "MMM yyyy"
- Follow existing console feature pattern (service, page component, dialog component)

## Files to Touch
- New: `libs/console/feature-experience/` (entire library — routes, service, page, dialog)
- Update: `apps/console/src/app/app.routes.ts` (add `/experiences` route)
- Update: `libs/console/shared/ui/src/lib/main-layout/main-layout.html` (add sidebar nav link)

## Dependencies
- 221 (API endpoints must exist)

## Complexity: L

## Progress Log
- [2026-04-04] Started
- [2026-04-04] Done — all ACs satisfied
