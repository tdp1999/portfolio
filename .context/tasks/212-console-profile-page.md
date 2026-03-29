# Task: Console profile settings page

## Status: pending

## Goal
Build the Angular console settings page for managing all Profile fields — multi-section form with dynamic arrays, media uploads, character counters, and JSON-LD preview.

## Context
Profile settings is the most complex console form in the project. It covers ~28 fields across 8 sections, includes dynamic array management (social links, certifications), media uploads (avatar, ogImage), and a JSON-LD preview panel. First time admin fills this form = first-time Profile creation (upsert on save).

## Acceptance Criteria

### Feature Library Setup
- [ ] Create `libs/console/feature-profile/` library (use `ng-lib` skill)
- [ ] Route: `/profile` in console app routes (under Settings nav section)
- [ ] Lazy-loaded, loads existing Profile data on init

### Section: Identity
- [ ] Bilingual inputs for fullName (en + vi side by side or tabbed)
- [ ] Bilingual inputs for title (en + vi)
- [ ] Bilingual textarea for bioShort (en + vi, ~200 chars)
- [ ] Bilingual textarea for bioLong (en + vi, rich or plain textarea)
- [ ] Avatar upload: uses Media module upload → sets avatarId. Shows current avatar preview. Clear/remove button.

### Section: Work & Availability
- [ ] yearsOfExperience (number input, min 0)
- [ ] availability (Material select: EMPLOYED, OPEN_TO_WORK, FREELANCING, NOT_AVAILABLE)
- [ ] openTo (multi-select chips: FREELANCE, CONSULTING, SIDE_PROJECT, FULL_TIME, SPEAKING, OPEN_SOURCE)

### Section: Contact
- [ ] email (text input, email validation)
- [ ] phone (text input, optional)
- [ ] preferredContactPlatform (select dropdown)
- [ ] preferredContactValue (text input, e.g. "@handle" or URL)

### Section: Location
- [ ] locationCountry (text input)
- [ ] locationCity (text input)
- [ ] locationPostalCode (text input, optional)
- [ ] locationAddress1, locationAddress2 (text inputs, optional)

### Section: Social Links (Dynamic Array)
- [ ] List of rows: platform (dropdown) + URL input + handle input (optional)
- [ ] Add row button
- [ ] Remove row button per row
- [ ] Reorder via drag-drop or up/down buttons (nice-to-have)
- [ ] URL validation per row

### Section: Resume
- [ ] EN resume URL input
- [ ] VI resume URL input
- [ ] External URLs only for now (no Media upload)

### Section: Certifications (Dynamic Array)
- [ ] List of rows: name + issuer + year (number) + URL (optional)
- [ ] Add row button
- [ ] Remove row button per row
- [ ] Year validation (1990–2100)

### Section: SEO & Meta
- [ ] metaTitle input with character counter (shows X/70)
- [ ] metaDescription textarea with character counter (shows X/160)
- [ ] ogImage upload: uses Media module → sets ogImageId. Preview shown.
- [ ] canonicalUrl input (URL validation)
- [ ] timezone select (dropdown of IANA timezones — at minimum: Asia/Ho_Chi_Minh, UTC, America/New_York, Europe/London)
- [ ] JSON-LD preview panel: read-only JSON display showing what will be injected in `<head>`

### Form Behaviour
- [ ] Loads existing Profile on init (prefills all fields)
- [ ] Save button dispatches PUT `/admin/profile` with full payload
- [ ] Success toast: "Profile saved"
- [ ] Error handling: field-level validation messages
- [ ] Unsaved changes indicator (optional nice-to-have)

**Specialized Skill:** ng-lib — use for creating the feature library with correct tags/directory/importPath.

## Technical Notes
- Use Angular reactive forms (FormGroup, FormArray for dynamic sections)
- Social links and certifications: use `FormArray` with typed `FormGroup` per item
- Avatar/ogImage upload: call Media upload endpoint → get Media ID → set on form field. Use existing Media upload pattern from media library page.
- JSON-LD preview: call `GET /profile/json-ld?locale=en` after save, or compute client-side from form values
- Bilingual inputs: simplest pattern = two separate inputs per translatable field (en label + vi label). Could use a reusable `translatable-input` component.
- `openTo` chips: Material chip list with toggle behaviour or a custom multi-select

## Files to Touch
- New: `libs/console/feature-profile/` (entire library)
- Update: console app routes (add `/profile` under settings)
- Update: console sidebar (add Profile link under Settings section)

## Dependencies
- 211 (API endpoints must exist)

## Complexity: L

## Progress Log
