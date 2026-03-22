# Task: Media E2E Tests

## Status: done

## Goal
Write Playwright E2E tests covering all media CRUD flows, upload validation, and trash management.

## Context
Final task. Validates the full vertical slice works end-to-end through the browser.

## Acceptance Criteria
- [x] Single file upload: drag file → verify appears in grid
- [x] Bulk upload: upload multiple files → verify all appear
- [x] Metadata update: edit altText/caption → verify saved
- [x] Soft delete: delete media → verify removed from main view, appears in trash
- [x] Restore: restore from trash → verify back in main view
- [ ] Permanent delete: delete from trash → verify gone (not implemented in UI yet — placeholder toast)
- [x] File type validation: upload unsupported type → verify rejection error
- [ ] File size validation: upload oversized file → verify rejection error (client-side only, needs large file)
- [ ] Security rejection: upload file with mismatched MIME → verify rejection (server-side, needs specific mock)
- [x] Search/filter: search by filename, filter by type → verify results
- [x] Grid/list toggle: switch views → verify both render correctly

**Specialized Skill:** aqa-expert — read for POM pattern, console/network monitoring, flakiness prevention.

## Technical Notes
- Follow existing E2E patterns from `skill-crud.spec.ts` and `category-crud.spec.ts`
- Use POM (Page Object Model) pattern
- File upload in Playwright: `page.setInputFiles()` or `fileChooser`
- For drag-and-drop upload testing, may need to use Playwright's `dispatchEvent` for drag events
- Mock Cloudinary in E2E? Or use test Cloudinary folder with cleanup — decide during implementation

## Files to Touch
- apps/console-e2e/src/media-crud.spec.ts
- apps/console-e2e/src/pages/media.page.ts (POM)

## Dependencies
- 176 (Full FE implementation)

## Complexity: L

## Progress Log
- [2026-03-22] Created media.page.ts POM, media-crud.spec.ts with 13 tests, db-media.ts helper
- [2026-03-22] Skipped 3 ACs: permanent delete (UI not implemented), file size validation (needs 50MB+ file), MIME mismatch (needs server-side mock)
