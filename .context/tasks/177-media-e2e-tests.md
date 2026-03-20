# Task: Media E2E Tests

## Status: pending

## Goal
Write Playwright E2E tests covering all media CRUD flows, upload validation, and trash management.

## Context
Final task. Validates the full vertical slice works end-to-end through the browser.

## Acceptance Criteria
- [ ] Single file upload: drag file → verify appears in grid
- [ ] Bulk upload: upload multiple files → verify all appear
- [ ] Metadata update: edit altText/caption → verify saved
- [ ] Soft delete: delete media → verify removed from main view, appears in trash
- [ ] Restore: restore from trash → verify back in main view
- [ ] Permanent delete: delete from trash → verify gone
- [ ] File type validation: upload unsupported type → verify rejection error
- [ ] File size validation: upload oversized file → verify rejection error
- [ ] Security rejection: upload file with mismatched MIME → verify rejection
- [ ] Search/filter: search by filename, filter by type → verify results
- [ ] Grid/list toggle: switch views → verify both render correctly

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
