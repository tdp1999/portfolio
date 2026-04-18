# Task: Extend list-media query with multi-field search, sort, and folder filter

## Status: done

## Goal
Extend the `ListMediaQuery` handler so the picker and media page can search across filename + altText + caption, sort by 4 options, and filter by `UPLOAD_FOLDERS`.

## Context
Today the picker only supports filename search and MIME prefix filter. Epic requires multi-field search, 4 sort options, and folder filter so the new UI can be genuinely useful on a growing library. BE change must land first because atoms bind to the new params.

## Acceptance Criteria
- [x] `ListMediaQuery` DTO accepts: `search` (string), `sort` ('createdAt_desc' | 'createdAt_asc' | 'filename_asc' | 'bytes_desc'), `folder` (enum matching UPLOAD_FOLDERS).
- [x] Zod schema validates all new params; invalid values → `BadRequestError`.
- [x] `search` performs Prisma `OR` across `originalFilename`, `altText`, `caption` (case-insensitive contains).
- [x] `sort` defaults to `createdAt_desc` when omitted. All 4 options produce correct orderBy.
- [x] `folder` filters via `publicId` prefix (`portfolio/{folder}/`) — Cloudinary folder encoded in publicId; no schema change.
- [x] Existing `mimeTypePrefix` param still works and composes with new filters (AND).
- [x] Controller signature unchanged (raw `unknown` body pattern); validation in handler.
- [x] Unit tests for handler cover: sort option, search, folder filter, combined filters, invalid folder/sort/pagination rejection.
- [x] Existing callers (media page current list) keep working without code change (new params optional).

## Technical Notes
- Layered architecture: validation in handler via Zod `safeParse`, never in controller.
- Follow `.context/patterns-architecture.md` CQRS pattern.
- Check `apps/api/src/modules/media/application/queries/list-media.query.ts` for current structure.
- If folder is not a first-class column, consider adding one in a follow-up migration — for v1 derive from Cloudinary tags if possible, otherwise add to Media schema (minor additive migration).

**Specialized Skill:** be-test — read `.claude/skills/be-test/SKILL.md` for guidelines.
**Key sections to read:** layer-rules, validation-checklist.

## Files to Touch
- apps/api/src/modules/media/application/queries/list-media.query.ts
- apps/api/src/modules/media/application/queries/list-media.handler.ts
- apps/api/src/modules/media/infrastructure/repositories/media.repository.ts
- apps/api/src/modules/media/application/queries/list-media.handler.spec.ts

## Dependencies
- None

## Complexity: M

## Progress Log
- [2026-04-17] Started. Using be-test skill (layer-rules, validation-checklist) for handler tests.
- [2026-04-17] Decision: folder filter derives from `publicId` prefix (format `portfolio/{folder}/...`) — no schema change. Matches AC fallback path.
- [2026-04-17] Extended `ListMediaSchema` with `folder` (UPLOAD_FOLDERS enum) + `sort` (4-option enum, default `createdAt_desc`). Exported `UploadFolder` type from media.constants.
- [2026-04-17] Multi-field search: changed `originalFilename contains` to Prisma `OR` across `originalFilename`, `altText`, `caption` (case-insensitive).
- [2026-04-17] Added `toOrderBy` helper in repository for 4 sort options.
- [2026-04-17] Handler tests: added folder/sort/combined-filters/invalid-folder/invalid-sort coverage. Fixed pre-existing stale mock missing `findByIdIncludeDeleted`.
- [2026-04-17] All 18 tests pass. `tsc --noEmit` clean.
- [2026-04-17] Done — all ACs satisfied.
