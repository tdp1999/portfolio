# Task: Category Module - Frontend Library + CRUD Page

## Status: pending

## Goal

Create Angular library for Category admin page with full CRUD functionality.

## Context

Follows the `console/feature-tag` library pattern. Create via `/ng-lib`. Includes list page with table, search, pagination, displayOrder column, and create/edit dialog with description textarea.

## Acceptance Criteria

- [ ] Angular library created: `libs/console/feature-category/` (use `/ng-lib`)
- [ ] `category.service.ts` — API service with list, create, update, delete methods
- [ ] `categories-page` component — Material table with columns: name, slug, description (truncated), displayOrder, actions
- [ ] Search bar filtering by name/description
- [ ] Pagination via MatPaginator
- [ ] `category-dialog` component — create/edit form with: name (input), description (textarea), displayOrder (number input)
- [ ] Form validation matching backend Zod schemas
- [ ] Delete via ConfirmDialogComponent (soft delete)
- [ ] Toast notifications for success/error feedback
- [ ] Signal-based state management (following tags-page pattern)
- [ ] Route registered in `app.routes.ts` at `/categories` with `adminGuard`
- [ ] Sidebar navigation entry added for Categories

## Technical Notes

Use `/ng-lib` to scaffold the library. Follow `feature-tag` structure exactly:
- `category.routes.ts` (lazy-loaded)
- `categories-page/` (list component)
- `category-dialog/` (create/edit dialog)
- `category.service.ts` (API calls)

Material components: MatTable, MatPaginator, MatDialog, MatButton, MatIcon, MatFormField, MatInput.
Shared components: FilterBarComponent, FilterSearchComponent, SpinnerOverlayComponent, ConfirmDialogComponent.

## Files to Touch

- libs/console/feature-category/src/lib/ (new library)
- apps/console/src/app/app.routes.ts (add route)
- Sidebar config (add nav entry)

## Dependencies

- 150-category-module-wiring (BE must be complete)

## Complexity: L

Full CRUD page with table, dialog, service, routing. Multiple components and files.

## Progress Log
