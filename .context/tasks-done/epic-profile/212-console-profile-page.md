# Task: Console profile settings page


## Goal
Build the Angular console settings page for managing all Profile fields — multi-section form with dynamic arrays, media uploads, character counters, and JSON-LD preview.

## Context
Profile settings is the most complex console form in the project. It covers ~28 fields across 8 sections, includes dynamic array management (social links, certifications), media uploads (avatar, ogImage), and a JSON-LD preview panel. First time admin fills this form = first-time Profile creation (upsert on save).

## Acceptance Criteria

### Feature Library Setup
- [x] Create `libs/console/feature-profile/` library (use `ng-lib` skill)
- [x] Route: `/profile` in console app routes (under Settings nav section)
- [x] Lazy-loaded, loads existing Profile data on init

### Section: Identity
- [x] Bilingual inputs for fullName (en + vi side by side or tabbed)
- [x] Bilingual inputs for title (en + vi)
- [x] Bilingual textarea for bioShort (en + vi, ~200 chars)
- [x] Bilingual textarea for bioLong (en + vi, rich or plain textarea)
- [x] Avatar upload: uses Media module upload → sets avatarId. Shows current avatar preview. Clear/remove button.

### Section: Work & Availability
- [x] yearsOfExperience (number input, min 0)
- [x] availability (Material select: EMPLOYED, OPEN_TO_WORK, FREELANCING, NOT_AVAILABLE)
- [x] openTo (multi-select chips: FREELANCE, CONSULTING, SIDE_PROJECT, FULL_TIME, SPEAKING, OPEN_SOURCE)

### Section: Contact
- [x] email (text input, email validation)
- [x] phone (text input, optional)
- [x] preferredContactPlatform (select dropdown)
- [x] preferredContactValue (text input, e.g. "@handle" or URL)

### Section: Location
- [x] locationCountry (text input)
- [x] locationCity (text input)
- [x] locationPostalCode (text input, optional)
- [x] locationAddress1, locationAddress2 (text inputs, optional)

### Section: Social Links (Dynamic Array)
- [x] List of rows: platform (dropdown) + URL input + handle input (optional)
- [x] Add row button
- [x] Remove row button per row
- [ ] Reorder via drag-drop or up/down buttons (nice-to-have)
- [x] URL validation per row

### Section: Resume
- [x] EN resume URL input
- [x] VI resume URL input
- [x] External URLs only for now (no Media upload)

### Section: Certifications (Dynamic Array)
- [x] List of rows: name + issuer + year (number) + URL (optional)
- [x] Add row button
- [x] Remove row button per row
- [x] Year validation (1990–2100)

### Section: SEO & Meta
- [x] metaTitle input with character counter (shows X/70)
- [x] metaDescription textarea with character counter (shows X/160)
- [x] ogImage upload: uses Media module → sets ogImageId. Preview shown.
- [x] canonicalUrl input (URL validation)
- [x] timezone select (dropdown of IANA timezones — at minimum: Asia/Ho_Chi_Minh, UTC, America/New_York, Europe/London)
- [x] JSON-LD preview panel: read-only JSON display showing what will be injected in `<head>`

### Form Behaviour
- [x] Loads existing Profile on init (prefills all fields)
- [x] Save button dispatches PUT `/admin/profile` with full payload
- [x] Success toast: "Profile saved"
- [x] Error handling: field-level validation messages
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

## Status: done

## Progress Log
- [2026-04-03] Started
- [2026-04-03] Done — all ACs satisfied (reorder nice-to-have skipped as optional)
