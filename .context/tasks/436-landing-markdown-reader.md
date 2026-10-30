# Task: Add a private markdown reader to landing

## Status: pending

## Goal

The Owner pushes a folder of markdown files with `pnpm reader:push` and reads each file at `/reader`, behind sign-in, like the checklist.

## Context

Standalone feature. The Owner wants one place to read their own markdown notes on the site. The checklist (epic `epic-landing-checklist`) already runs the same pipeline (local folder → push script with a sync token → API stores the docs → private landing page renders them with `marked`), so this feature copies that pipeline without the template / run / lookup parsing: each file is stored as raw markdown.

Decisions (2026-10-12):

- Source folder: a dedicated folder in the learning repo, default `~/Code/personal/learning/reader/`.
- Private, behind the Owner sign-in, like the checklist.
- Storage option A: its own API module and table, not a new `ChecklistDocKind` (would couple the reader to the checklist domain) and not static files in `public/` (readable by anyone with the URL).

## Business Rules

Readable in one place: `ReaderFilePolicy` (rules 1-4) and the sync command (rules 5-7). Rule 8 lives in the list query.

1. Only files ending in `.md` are accepted.
2. `README.md` and every file or folder whose name starts with `_` or `.` are skipped.
3. A doc is identified by its relative path without `.md` (e.g. `angular/signals`); the URL uses that path.
4. A doc's title is its first `# ` heading, or the file name when it has none.
5. A file whose SHA-256 equals the stored hash is not rewritten.
6. A stored doc whose file is missing from a push is archived, never hard-deleted.
7. An archived doc whose file is pushed again is unarchived and keeps its URL. (Assumed, awaiting Owner review.)
8. The list is sorted by path and grouped by subfolder.

## Acceptance Criteria

- [ ] When the Owner runs `pnpm reader:push` with a valid token, the API shall store every accepted file under its relative path, and the script shall print the created / updated / unchanged / archived lists.
- [ ] The push shall skip `README.md` and every file or folder whose name starts with `_` or `.`.
- [ ] If a file's SHA-256 equals the stored hash, then the sync shall not write that doc and shall report it as unchanged.
- [ ] When a stored doc's file is missing from a push, the sync shall set `archivedAt` and keep the row.
- [ ] When an archived doc's file is pushed again, the sync shall clear `archivedAt`.
- [ ] If the push token is missing or wrong, then `POST /api/reader/sync` shall answer 401 and change nothing.
- [ ] A doc's title shall be its first `# ` heading, or the file name when it has none.
- [ ] `/reader` shall list live docs grouped by subfolder and sorted by path, each with title, path and last update; it shall show an empty state when there are none and an alert when the load fails.
- [ ] `/reader/<path>` shall render the doc's markdown inside `.landing-prose`; an unknown or archived path shall show "Document not found".
- [ ] When a signed-out visitor opens any `/reader` URL, the app shall redirect to sign-in; the API list and detail routes shall require ADMIN.
- [ ] The header's Workspace menu and the workspace bar shall show Reader, with both locales in `LANDING_COPY`.
- [ ] Checklist shall render markdown through the shared function, and its existing tests shall still pass.
- [ ] Unit tests shall cover the file policy, the title rule, and the sync (create, update, unchanged, archive, unarchive); `nx build api` and `nx build landing` shall pass.

## Technical Notes

- **Reuse map** (copy the pattern unless noted):
  - Push script: `apps/api/scripts/checklist-push.ts` → `apps/api/scripts/reader-push.ts`. The checklist files were removed when the checklist moved to the plugin repo; read them from git history (`git log --diff-filter=D -- apps/api/scripts/checklist-push.ts`). Env `READER_SYNC_TOKEN`, `READER_API_URL`, `READER_DIR` (default `~/Code/personal/learning/reader`).
  - Token: `checklist-sync.config.ts` + `ChecklistSyncTokenGuard` → `READER_SYNC_TOKEN_HASH` (hex SHA-256; unset answers 401, never fails the boot). The Owner sets it on Railway; document the hash command in the progress log.
  - API module: same layering as `apps/api/src/modules/checklist/` (CQRS commands/queries, presenter, mapper, repository port). Controller guarded by `JwtAccessGuard` + `RoleGuard` + `@Roles(['ADMIN'])`; sync controller by `ThrottlerGuard` + token guard.
  - Schema: `ReaderDoc` (`id`, `path` unique, `title`, `markdown`, `sourceHash`, `archivedAt`, timestamps) → `reader_docs`, through the `prisma-migrate` skill.
  - FE lib: `libs/landing/feature-reader` via the `ng-lib` skill. `reader.list` follows `checklist-template.list` (BackLink, EmptyState, Icon, list markup); `reader.detail` binds `[innerHTML]` (Angular sanitizes) inside `.landing-prose` from `libs/landing/shared/ui/src/styles/_prose.scss`. Do not copy the ref panel's `::ng-deep` block; it is sized for the panel.
  - Service: `ReaderService` provided in `reader.routes.ts`, like `ChecklistService`, so it injects the token-carrying HttpClient.
  - Routing: add `reader` to `PRIVATE_ROUTES` (`apps/landing/src/app/pages/private/private.routes.ts`); noindex and client-only follow from `PRIVATE_PATHS`. Detail route uses a `UrlMatcher` that consumes all remaining segments as the path.
  - Menu: add an entry to `workspacePages` in `libs/landing/shared/ui/src/components/header/header.data.ts`; label and hint keys in `LANDING_COPY`. Page copy stays English-only like the checklist: add `libs/landing/feature-reader/` to `OUT_OF_SCOPE` in `landing-copy-contract.spec.ts`.
  - Shared markdown: move `renderSectionMarkdown` (`libs/landing/feature-checklist/src/lib/checklist-markdown.util.ts`) to `libs/landing/shared/util` as `renderMarkdown`; update the checklist ref panel import.
- **Out of scope:** search, table of contents, code highlighting, links between files, editing on the web.

## Files to Touch

- apps/api/src/modules/reader/** (new)
- apps/api/src/app/app.module.ts (register module)
- apps/api/prisma/schema.prisma + migration
- apps/api/scripts/reader-push.ts (new)
- package.json (`reader:push` script)
- libs/landing/feature-reader/** (new)
- libs/landing/shared/util (shared `renderMarkdown`)
- libs/landing/feature-checklist/src/lib/checklist-markdown.util.ts (removed)
- libs/landing/feature-checklist/src/lib/checklist.ref-panel/checklist.ref-panel.ts
- libs/shared/types (reader DTO types)
- apps/landing/src/app/pages/private/private.routes.ts
- libs/landing/shared/ui/src/components/header/header.data.ts
- libs/landing/shared/ui/src/services/copy/landing-copy.data.ts (path to verify)
- apps/landing/src/app/landing-copy-contract.spec.ts

## Dependencies

None

## Complexity: XL

**Reasoning:** A new API module, a migration, a push script, a new landing lib and a shared extraction. Most of it copies checklist patterns, so the unknowns are small; split into BE + script and FE tasks if it grows.

## Progress Log
