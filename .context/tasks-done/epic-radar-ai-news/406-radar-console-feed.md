# Task: Radar — console feature lib, sources, upload and Feed page

## Status: done

## Goal

Create `libs/console/feature-radar` with a Feed page the Owner can skim and filter, plus source management and the JSON upload entry point.

## Context

Epic `epic-radar-ai-news` (Phase A). This is the main reading surface. Speed over polish, but it must follow the console cookbook and design contracts.

## Acceptance Criteria

- [x] `/radar` is reachable from the console nav under the admin group.
- [x] The Feed lists items newest first, 50 per page, showing publish date, TL;DR (or the first 200 characters of text when not yet enriched), provider tags, content-type tag, signal score, promo flag, and relevant flag.
- [x] The Feed filters by provider tag, content-type tag, minimum signal score, and promo visibility (promo hidden by default).
- [x] The Feed search matches post text and TL;DR.
- [x] The Owner can add a source and upload a JSON export for it; the result counts (created, updated, failed) appear in a toast.
- [x] If the upload is rejected, then the field-level errors from the API are shown and the Feed is unchanged.
- [x] Unenriched items are visibly marked as pending analysis.
- [x] Clicking an item opens the Detail route.
- [x] The Feed shows how many items are stuck (claimed 3 times without a stored result) and the Owner can re-queue them, which resets `claimCount` to 0 and `workStatus` to `PENDING` (new admin endpoint, e.g. `POST /radar/items/requeue-stuck`). Agreed with the Owner 2026-10-05 after the 404 review.

## Technical Notes

- **Decisions (2026-10-05, Owner):**
  - The Feed backend is built inside this task: `GET /radar/items` (filters, search, page of 50, `{data,total,page,limit}`), `GET /radar/items/stats` (`pending`, `stuck`, `paused`), `POST /radar/items/requeue-stuck` (`{requeued}`), and `GET /radar/items/:id`.
  - 406 ships a minimal Detail page (record view: original text + TL;DR); 407 extends it (images, links, prev/next, profile editor).
  - Feed row = dense 2-tier row. Tier 1: score badge + TL;DR (widest element); unenriched items show a "pending analysis" marker + the first 200 characters of text. Tier 2: date · source · provider tags · content type · flags.
  - Stuck = not DONE, `claimCount >= MAX_CLAIM_ATTEMPTS`, lease not live. Paused = not DONE and the source is inactive. Re-queue only touches stuck items of active sources.
  - The console nav lives in `libs/console/shared/ui/src/components/main-layout/main-layout.html`.
- **From 405 review (2026-10-05):** claim skips items of inactive sources, so a deactivated source's PENDING items never get claimed and never reach `claimCount` 3. The stuck count (based on `claimCount`) will not include them; the Feed should show them under their source as "paused" (or the source list shows a pending count), not as stuck.
- Create the lib with the ng-lib skill. Mount with `loadChildren` in `apps/console/src/app/app.routes.ts` inside the `adminGuard` group.
- Follow `libs/console/feature-messages` structure: `radar.routes.ts`, `radar.service.ts` (wraps `ApiService`), `radar.types.ts`, `radar.feed/`, `radar.detail/` (folder names per `.context/patterns-file-structure.md`).
- Reuse `FilterBar`, `FilterSearch`, `FilterSelect`, `MatPaginator`, `SpinnerOverlay`, `ToastService`, `asset-upload-zone`, `relative-time`, `skeleton` from `@portfolio/console/shared/ui`.
- Card vs table: start with a dense list row (TL;DR needs width). Read `.context/design/cookbook/console.md` before writing HTML/SCSS.
- Filter enums come from the shared constant defined in 404.

**Specialized Skill:** ng-lib — generates the feature lib with correct tags, directory and import path
**Key sections to read:** feature lib under `console/`

## Files to Touch

- libs/console/feature-radar/\*\* (new)
- apps/console/src/app/app.routes.ts
- console nav config (where other admin features are listed)

## Dependencies

- 402 - upload and source endpoints
- 404 - enrichment fields and shared enum constant

## Complexity: L

## Progress Log

- 2026-10-05 Started. Backend endpoints first (TDD, Postgres integration spec), then the console lib.
- 2026-10-05 Backend done: `GET /radar/items`, `GET /radar/items/stats`, `POST /radar/items/requeue-stuck`, `GET /radar/items/:id` + `RADAR_ITEM_NOT_FOUND`. Radar API suite 50/50 (8 new Postgres integration tests for list filters, search, pagination, stuck/paused counts, re-queue; 12 new handler tests).
- 2026-10-05 Console lib `feature-radar` created (`radar-item.list`, `radar-item.detail` minimal, `radar-source.dialog` for add source + upload + pause/resume), route `/radar` + nav entry under Operations. Lint clean, lib tests 3/3, `nx build console` passes. Outstanding: visual check on a running console + API before ticking the ACs.
- 2026-10-05 Visual pass (Playwright, 1440px): two-tier rows aligned (text and meta share one left edge), no horizontal scroll, promo toggle, enriched and pending Detail. Partial upload failures now show a warning toast plus the per-post reasons; a malformed file is rejected with field errors and the Feed stays unchanged. Lib + console tsc clean, lint clean, specs green.
- 2026-10-05 Done — all ACs satisfied
- 2026-10-05 Follow-up from Owner review: Feed list rebuilt as a sortable mat-table (Score, Summary, Type, Providers, Status, Source, Published; server-side sortBy/sortDir, unanalyzed items stay last on score sort). Added empty / no-match / load-error states (Feed, Detail 404 + failed, Sources dialog). Shared fixes: dialog content padding 16px to 20px to line up with title/actions, button leading-icon line-height. Console build passes, radar API suite 54/54.
