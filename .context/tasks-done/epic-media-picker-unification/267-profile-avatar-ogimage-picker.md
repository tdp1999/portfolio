# Task: Migrate Profile avatar + OG image to MediaPickerDialog

## Status: done

## Goal
Replace inline upload UI for `Profile.avatarId` and `Profile.ogImageId` with picker triggers, both single-select, `mimeFilter: 'image/'`, with default folders `avatars` and `logos`.

## Context
Profile page is the only remaining place using inline upload. Migrating to picker unifies UX and lets admins reuse previously uploaded images without re-uploading.

## Acceptance Criteria
- [x] Profile settings page (Identity section): avatar field renders current avatar preview + "Change" button → opens MediaPickerDialog (single, `mimeFilter: 'image/'`, default folder `avatars`).
- [x] Profile settings page (SEO section): OG image field same pattern, default folder `logos`.
- [x] Selecting a media in picker sets the corresponding form control to the Media ID.
- [x] "Remove" button clears the field (sets null).
- [x] Save persists the new avatar/og-image IDs via existing PATCH endpoints.
- [x] Inline upload UI and its handlers deleted from profile page.
- [x] Preview updates immediately after selection (uses Media URL from picker result).
- [x] Existing profile entity/commands unchanged (still accept avatarId / ogImageId).
- [x] Visual check in browser: avatar + og image flows work end-to-end.

## Technical Notes
- Picker returns Media ID; need to resolve URL for preview. Extend picker result to include URL, or fetch Media by ID after select.
- Form validation unchanged (optional fields).
- Follow `.context/design/console-cookbook.md` for section layout.

**Specialized Skill:** playwright-skill — browser validation.

## Files to Touch
- libs/console/feature-profile/src/lib/profile-page/profile-page.ts
- libs/console/feature-profile/src/lib/profile-page/profile-page.html
- libs/console/feature-profile/src/lib/profile-page/sections/identity-section.component.ts (or similar)
- libs/console/feature-profile/src/lib/profile-page/sections/seo-section.component.ts (or similar)

## Dependencies
- 263 — rebuilt MediaPickerDialog

## Complexity: M

## Progress Log
- [2026-04-19] Started
- [2026-04-19] Added defaultFolder to MediaPickerDialogData, wired into dialog init
- [2026-04-19] Replaced inline upload with picker triggers on profile page; all type checks pass
- [2026-04-19] Smoke-tested — avatar/og-image picker flows verified end-to-end; task complete
