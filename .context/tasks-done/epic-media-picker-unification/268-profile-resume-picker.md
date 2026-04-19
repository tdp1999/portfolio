# Task: Migrate Profile resume (EN/VI) to MediaPickerDialog

## Status: done

## Goal
Replace the resume URL text inputs in the profile page with picker triggers per locale. Keep `Profile.resumeUrls` JSON shape `{ en?: string, vi?: string }` — picker writes the Media URL into the slot.

## Context
Currently `resumeUrls` is edited as two plain URL text inputs, so admins must upload elsewhere and paste the URL. Picker lets them upload + select in one flow; JSON shape unchanged means no BE/schema work.

## Acceptance Criteria
- [x] Profile page Resume section shows two rows: EN and VI.
- [x] Each row: current filename/URL preview + "Change" button → MediaPickerDialog (single, `mimeFilter: 'application/pdf'`).
- [x] On select, picker-returned URL is written into the corresponding locale key of `resumeUrls`.
- [x] "Remove" button clears that locale key.
- [x] Existing translatable-group directive pattern may be reused.
- [x] Save persists via existing profile command unchanged.
- [x] No schema change — JSON structure preserved.
- [x] Visual check: upload PDF via picker → URL appears in field → save → reload → download link works.

## Technical Notes
- Picker returns Media URL (resolved) along with Media ID — need both; ID for future flexibility, URL for `resumeUrls` JSON.
- If picker currently returns only ID, extend result shape in task 263 (list there if needed).

**Specialized Skill:** playwright-skill — validate in browser.

## Files to Touch
- libs/console/feature-profile/src/lib/profile-page/sections/resume-section.component.ts (or equivalent)
- libs/console/feature-profile/src/lib/profile-page/profile-page.html

## Dependencies
- 263 — rebuilt MediaPickerDialog

## Complexity: M

## Progress Log
- 2026-04-19 Started
- 2026-04-19 Implemented — replaced translatable-group with EN/VI picker rows; added openResumePicker/clearResumeUrl; injected MediaService; types check clean
- 2026-04-19 Smoke-tested — PDF upload → picker selection → save → reload → download link works; task complete
