# Task: Media FE Metadata Edit + Trash View

## Status: done

## Goal
Build the metadata editing dialog and trash management view for soft-deleted media.

## Context
Completes the admin media management UI with editing and trash/restore functionality.

## Acceptance Criteria
- [x] Metadata edit dialog: edit altText and caption for a media item
- [x] Dialog opens on click from grid/list view
- [x] Shows file preview, filename, type, size, upload date (read-only info)
- [x] Save dispatches update metadata API call
- [x] Bulk actions: multi-select in grid/list → bulk delete
- [x] Trash view: separate tab/route showing soft-deleted media
- [x] Trash items show: filename, deleted date, deleted by
- [x] Restore button per item and bulk restore
- [x] Permanent delete button with confirmation dialog
- [x] Toast notifications for all actions (upload success/fail, delete, restore, update)
- [x] Error handling: display API errors in toasts

## Technical Notes
- Use Angular Material dialog for metadata editing
- Bulk selection: checkbox per item, select-all toggle
- Trash view can be a tab on the media page or a sub-route
- Follow existing dialog patterns from skill-dialog

## Files to Touch
- libs/console/feature-media/src/lib/media-dialog/media-dialog.ts
- libs/console/feature-media/src/lib/media-page/media-page.ts (add bulk actions, trash tab)
- libs/console/feature-media/src/lib/media-page/media-page.html

## Dependencies
- 175 (Upload + browser UI)

## Complexity: L

## Progress Log
- [2026-03-22] Done — all ACs satisfied. Media dialog, bulk select, trash view with restore.
