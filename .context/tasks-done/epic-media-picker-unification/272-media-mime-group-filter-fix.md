# Task: Fix Docs/Archives mime group filters (silently return all media)

## Status: done

## Goal
Make `Docs` and `Archives` mime-group chips in `asset-filter-bar` actually filter media on the BE, instead of silently returning all rows.

## Context
Discovered during manual testing of task 263 (media picker rebuild). The asset-filter-bar has five mime-group chips (`image | video | pdf | doc | archive`) but BE's `ListMediaQuery` accepts only a single `mimeTypePrefix: string`. `doc` and `archive` span multiple MIME types that share no single prefix (e.g. `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/zip`, `application/x-rar-compressed`), so the FE picker's `MIME_GROUP_TO_PREFIX` has no mapping for them. Result: clicking those chips sends no `mimeTypePrefix`, BE returns all media, chip stays visually active — a UX lie.

Evidence: `libs/console/shared/ui/src/lib/media-picker-dialog/media-picker-dialog.ts` defines `MIME_GROUP_TO_PREFIX: Partial<Record<MimeGroup, string>>` with only `image/video/pdf` entries. `apps/api/src/modules/media/application/media.dto.ts:35` accepts `mimeTypePrefix: z.string().optional()` only.

## Acceptance Criteria
- [x] BE `ListMediaQuery` accepts a new `mimeGroup` param: enum `'image' | 'video' | 'pdf' | 'doc' | 'archive'` (or equivalent shape).
- [x] BE owns the group → MIME-set mapping. `doc` group matches at minimum: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`, `text/plain`, `text/csv`. `archive` group matches at minimum: `application/zip`, `application/x-rar-compressed`, `application/x-7z-compressed`, `application/x-tar`, `application/gzip`.
- [x] `mimeGroup` and existing `mimeTypePrefix` compose predictably: if both present, `mimeGroup` wins (documented) OR they AND together — pick one and stick with it in the handler test.
- [x] FE `MediaListParams` adds `mimeGroup?: MediaMimeGroup`; `MediaService.list()` forwards it. `MediaMimeGroup` type exported from `console/shared/data-access`.
- [x] Media picker dialog passes `mimeGroup` directly to `MediaService.list()` instead of mapping to prefix. `MIME_GROUP_TO_PREFIX` constant and `resolveMimePrefix()` helper deleted or reduced to the caller-override path only.
- [x] Media page filter (task 264 / feature-media) uses the new param.
- [x] BE handler unit tests cover each group (especially `doc` and `archive`) returning the expected subset.
- [x] Manual: opening the picker without a caller `mimeFilter`, clicking `Docs` → only doc MIMEs returned; clicking `Archives` → only archive MIMEs; clicking `Images` / `Video` / `PDF` → unchanged behavior.

## Technical Notes
- **Preferred shape (Option A in discussion):** BE-owned group enum. Rationale: FE shouldn't own the mime-type catalog — it changes with every new office format. BE centralizes the set, FE just sends a string. Option B (array of OR'd prefixes) leaks the catalog to FE and requires array coercion in the DTO.
- Add group → MIME set constant in `apps/api/src/modules/media/application/media.constants.ts` next to `UPLOAD_FOLDERS`.
- Handler: translate `mimeGroup` to `mimeType: { in: [...] }` Prisma clause. Reuse or extend the existing `repo.findAll` signature — keep `mimeTypePrefix` backwards compatible (optional, independent).
- Zod: `z.enum(['image', 'video', 'pdf', 'doc', 'archive']).optional()`.
- Delete `MIME_GROUP_TO_PREFIX` constant in the picker and the `resolveMimePrefix()` mapping logic. Caller's `data.mimeFilter` override still passes through `mimeTypePrefix` unchanged (it's a prefix, not a group).
- Keep `MimeGroup` type in `asset-filter-bar.types.ts`; re-exported through `shared/data-access` as `MediaMimeGroup` or share via a new shared module if circular-dep risk.

**Specialized Skill:** be-test — handler tests for the new param. Key sections: layer-rules, validation-checklist.

## Files to Touch
- apps/api/src/modules/media/application/media.dto.ts
- apps/api/src/modules/media/application/media.constants.ts
- apps/api/src/modules/media/application/queries/list-media.query.ts
- apps/api/src/modules/media/application/queries/list-media.handler.spec.ts
- apps/api/src/modules/media/application/ports/media.repository.port.ts
- apps/api/src/modules/media/infrastructure/repositories/media.repository.ts
- libs/console/shared/data-access/src/lib/media/media.types.ts
- libs/console/shared/data-access/src/lib/media/media.service.ts
- libs/console/shared/data-access/src/index.ts
- libs/console/shared/ui/src/lib/media-picker-dialog/media-picker-dialog.ts
- libs/console/feature-media/* (if task 264 lands first, update call sites)

## Dependencies
- 263 (done) — picker rebuild introduced the broken chips.
- Touches the same BE query as 259 (done) — additive, no conflict.

## Complexity: M

**Reasoning:** Small additive BE DTO/handler change + FE param plumbing + one set of handler tests. No schema migration, no FE UI work beyond deleting dead code. Scope creep risk: deciding the doc/archive MIME catalog — kept pragmatic in ACs.

## Progress Log
- 2026-04-19 Started
- 2026-04-19 BE: added MIME_GROUP_SETS + MEDIA_MIME_GROUPS to constants; mimeGroup Zod param in DTO; mimeTypes exact-IN path in repo; handler translates group → types (mimeGroup wins)
- 2026-04-19 FE: MediaMimeGroup exported from util/data-access; mimeGroup forwarded in MediaService.list(); picker dialog MIME_GROUP_TO_PREFIX + resolveMimePrefix() deleted; media-page mimeGroupToPrefix() deleted
- 2026-04-19 Tests: 7 new mimeGroup handler tests (all 5 groups + mimeGroup-wins + invalid value); fixed 2 pre-existing tests (mimeTypePrefix now array after Zod transform)
- 2026-04-19 Smoke-tested — Docs/Archives chips now filter correctly; Images/Video/PDF unchanged; task complete
