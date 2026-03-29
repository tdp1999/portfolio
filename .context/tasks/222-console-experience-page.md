# Task: Console experience management page

## Status: pending

## Goal
Build the Angular console page for managing work history — list view with table and create/edit dialog with multi-section form including translatable inputs, skills multi-select, date pickers, and company logo upload.

## Context
Experience console page follows the Skill page pattern (list + dialog) but is more complex due to: 4 translatable JSON fields (en/vi inputs), dynamic achievements array, skills multi-select, company logo upload, and date pickers with "current position" toggle. This is the second console form with translatable fields (after Profile settings).

## Acceptance Criteria

### Feature Library Setup
- [ ] Create `libs/console/feature-experience/` library (use `ng-lib` skill)
- [ ] Route: `/experiences` in console app routes
- [ ] Lazy-loaded, sidebar nav link added under Admin section
- [ ] Loads experience list on init

### List Page (experiences-page)
- [ ] Angular Material table with columns: company name, position (en), employment type badge, location type badge, date range, actions
- [ ] Pagination (standard page/limit)
- [ ] Search input (searches across companyName, position)
- [ ] Row actions: Edit (opens dialog), Delete (soft delete with confirm), Restore (if deleted)
- [ ] "Add Experience" button opens create dialog
- [ ] Empty state when no experiences exist
- [ ] Date range display: "Jan 2023 – Present" or "Mar 2021 – Dec 2022"
- [ ] Employment type and location type shown as small badges/chips

### Create/Edit Dialog (experience-dialog)
- [ ] Multi-section form:

**Company Section:**
- [ ] companyName (text input, required)
- [ ] companyUrl (URL input, optional)
- [ ] Company logo upload (uses existing Media upload pattern, shows preview, clear button)

**Role Section:**
- [ ] position: bilingual inputs (en + vi, required)
- [ ] description: bilingual textareas (en + vi, optional)
- [ ] employmentType: Material select dropdown
- [ ] teamRole: bilingual inputs (en + vi, optional)

**Dates Section:**
- [ ] startDate: Material date picker (required)
- [ ] endDate: Material date picker (optional)
- [ ] "Current position" checkbox — when checked, endDate is disabled and set to null

**Location Section:**
- [ ] locationType: Material select dropdown (REMOTE, HYBRID, ONSITE)
- [ ] locationCountry, locationCity (text inputs)
- [ ] locationPostalCode, locationAddress1, locationAddress2 (text inputs, optional)

**Skills Section:**
- [ ] Multi-select from existing skills (Material autocomplete with chips, or checkbox list)
- [ ] Fetches available skills from Skill API
- [ ] Selected skills shown as removable chips

**Achievements Section:**
- [ ] Tab or toggle for EN / VI
- [ ] Dynamic array per language: add/remove achievement bullet points
- [ ] Each bullet is a text input with remove button
- [ ] "Add Achievement" button per language tab

**Context Section (optional/collapsible):**
- [ ] clientName, clientIndustry, domain (text inputs)
- [ ] teamSize (number input)

**Display Section:**
- [ ] displayOrder (number input, default 0)

### Form Behaviour
- [ ] Create mode: empty form, save dispatches POST
- [ ] Edit mode: prefilled with existing data, save dispatches PUT
- [ ] Save button: disabled until form valid
- [ ] Success toast after save, refreshes list
- [ ] Error handling: field-level validation messages

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
