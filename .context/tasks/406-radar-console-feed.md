# Task: Radar — console feature lib, sources, upload and Feed page

## Status: pending

## Goal
Create `libs/console/feature-radar` with a Feed page the Owner can skim and filter, plus source management and the JSON upload entry point.

## Context
Epic `epic-radar-ai-news` (Phase A). This is the main reading surface. Speed over polish, but it must follow the console cookbook and design contracts.

## Acceptance Criteria
- [ ] `/radar` is reachable from the console nav under the admin group.
- [ ] The Feed lists items newest first, 50 per page, showing publish date, TL;DR (or the first 200 characters of text when not yet enriched), provider tags, content-type tag, signal score, promo flag, and relevant flag.
- [ ] The Feed filters by provider tag, content-type tag, minimum signal score, and promo visibility (promo hidden by default).
- [ ] The Feed search matches post text and TL;DR.
- [ ] The Owner can add a source and upload a JSON export for it; the result counts (created, updated, failed) appear in a toast.
- [ ] If the upload is rejected, then the field-level errors from the API are shown and the Feed is unchanged.
- [ ] Unenriched items are visibly marked as pending analysis.
- [ ] Clicking an item opens the Detail route.

## Technical Notes
- Create the lib with the ng-lib skill. Mount with `loadChildren` in `apps/console/src/app/app.routes.ts` inside the `adminGuard` group.
- Follow `libs/console/feature-messages` structure: `radar.routes.ts`, `radar.service.ts` (wraps `ApiService`), `radar.types.ts`, `radar.feed/`, `radar.detail/` (folder names per `.context/patterns-file-structure.md`).
- Reuse `FilterBar`, `FilterSearch`, `FilterSelect`, `MatPaginator`, `SpinnerOverlay`, `ToastService`, `asset-upload-zone`, `relative-time`, `skeleton` from `@portfolio/console/shared/ui`.
- Card vs table: start with a dense list row (TL;DR needs width). Read `.context/design/cookbook/console.md` before writing HTML/SCSS.
- Filter enums come from the shared constant defined in 404.

**Specialized Skill:** ng-lib — generates the feature lib with correct tags, directory and import path
**Key sections to read:** feature lib under `console/`

## Files to Touch
- libs/console/feature-radar/** (new)
- apps/console/src/app/app.routes.ts
- console nav config (where other admin features are listed)

## Dependencies
- 402 - upload and source endpoints
- 404 - enrichment fields and shared enum constant

## Complexity: L

## Progress Log
