# Task: Certification dual-mode (file vs external link) with picker

## Status: pending

## Goal
Add a "Upload file / External link" toggle per certification row. File mode uses MediaPickerDialog (single, `mimeFilter: 'application/pdf'`); link mode keeps the text input. The `url` field in the certifications JSON is populated for both modes.

## Context
Industry norm (LinkedIn, Credly) lets users either upload a credential PDF or link to an external issuer page. Current UI only supports the latter.

## Acceptance Criteria
- [ ] Each certification row has a mode toggle (segmented control: "File" vs "Link").
- [ ] Link mode: URL text input (existing behavior).
- [ ] File mode: picker trigger button → MediaPickerDialog → selected URL written into `url` field.
- [ ] Mode is transient UI state; `certifications` JSON schema unchanged (still `{ name, issuer, year, url? }`).
- [ ] Mode inferred on load by inspecting URL origin (Cloudinary → File mode; else Link mode). Override possible via toggle.
- [ ] Validation adapts: link mode accepts any URL; file mode accepts only picker-returned URLs (no manual paste).
- [ ] Add row / remove row still works.
- [ ] Visual check: switch modes, add/remove rows, save, reload — state persists correctly.

## Technical Notes
- Mode is a local UI flag per row, not stored in DB.
- `switchMap` for async picker open, no nested subscribes.
- Type discipline: use strict types, no `$any` or casts in templates.

**Specialized Skill:** ui-ux-pro-max — segmented toggle style, row layout with two modes, empty-URL state.

## Files to Touch
- libs/console/feature-profile/src/lib/profile-page/sections/certifications-section.component.ts (or equivalent)
- libs/console/feature-profile/src/lib/profile-page/profile-page.html

## Dependencies
- 263 — rebuilt MediaPickerDialog

## Complexity: M

## Progress Log
