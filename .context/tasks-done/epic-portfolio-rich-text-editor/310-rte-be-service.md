# Task: BE — `RichTextService` Write-Time Pipeline

## Status: done

> **Scope (user decision 2026-06-23):** "Engine + Profile reference". The reusable engine (`RichTextService` + `RichTextModule` + `*EditorDocumentSchema`) is complete and Profile.bioLong is wired end-to-end as the proven pattern. The other 4 modules' write-side wiring is **deferred** — see Deferred section.

## Deferred (fold into task 311 — console editor swap, or a dedicated follow-up)
Apply the exact Profile.bioLong pattern to the remaining 8 rich-field groups when their console editors emit `EditorDocument` (task 311):
- **Project** — `body` (UpdateProjectHandler) + nested TechnicalHighlight `challenge`/`approach`/`outcome` (via `TechnicalHighlightInput`).
- **BlogPost** — `content` (UpdatePostHandler). ⚠️ DTO is currently single-language `string` while storage is bilingual — resolve the en/vi input contract during the swap.
- **Experience** — `description`/`responsibilities`/`highlights` (UpdateExperienceHandler).
Each needs: optional `*Json` DTO field (reuse `BilingualEditorDocumentSchema`), entity atomic setter, handler call to `RichTextService`, integration test. Sanitization-behavior assertions already covered by `rte-core/rte.sanitize.spec.ts`. **Atomicity pattern (W1 lesson):** persist the rich-text triple in the SAME write as the rest of the section (single-row modules → fold the `*Json`/`*Html`/`*SchemaVersion` columns into the existing section update, as `Profile.updateIdentity` now does; multi-table modules like Project + nested TechnicalHighlight → wrap in one `prisma.$transaction`). Never two independent writes. Also run the `RichTextService` pipeline BEFORE the write so a bad document throws (shaped 400) without a half-applied update.

## Goal
Centralize the JSON → HTML generation + sanitization pipeline so every command handler that writes a rich field produces all 3 columns in a single transaction.

## Context
Write-time: `contentJson` arrives from console → `generateHTML` (Tiptap headless, Node-side) → `sanitizeRichText` → persist `{ json, html, schemaVersion }`. The whitelist + sanitizer live in the **Angular-free** `rte-core` lib (task 308), so this Node service shares them with the FE renderer without bundling Angular — that shared gate is the belt-and-braces guarantee.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 4.

## Acceptance Criteria
- [x] New module `apps/api/src/modules/shared/rich-text/`.
- [x] `RichTextService.toCanonicalForm(json: EditorDocument): { json: EditorDocument, html: string, schemaVersion: number }` (**async** — `generateHTML` is async):
  - runs `migrateDoc(json)` first (lazy migration on write)
  - calls `generateHTML(json, extensionList)` from `@phuong-tran-redoc/document-engine-core` (re-exported in sprint 1)
  - sanitizes by calling `sanitizeRichText` (DOMPurify + `RICH_TEXT_WHITELIST`) imported from `@portfolio/shared/features/rte-core` (Angular-free — no Angular pulled into the API)
  - returns the latest schema version from doc-engine-core
- [x] Translatable variant: `toCanonicalFormTranslatable({ en, vi }): { json: { en, vi }, html: { en, vi }, schemaVersion }` (async).
- [~] Module imported by Profile, Project, BlogPost, Experience, TechnicalHighlight modules. **Scoped (user decision): Profile only this task; Project/BlogPost/Experience/TechnicalHighlight wiring deferred to task 311 (console swap, when EditorDocument input actually arrives).**
- [~] Each command handler that accepts a rich field calls the service before persisting; entity setters for the rich field group take all 3 values atomically. **Scoped: Profile.bioLong wired as reference; others deferred to 311.**
- [x] When sanitization strips nodes, log a warning with the field name + diff (no exception). (diff = raw→clean char-length delta.)
- [~] Unit tests: known JSON → expected sanitized HTML; `<script>` stripped; `target="_blank"` enforced on links; all 5 module command handlers tested via integration. **Service unit tests done; sanitization-behavior assertions (script strip / target=_blank / whitelist) live in `rte-core/rte.sanitize.spec.ts` (the shared gate's home, the only place jsdom loads). Profile handler integration done; other 4 deferred to 311.**

## Technical Notes
- Tiptap headless (`@tiptap/html`) + extension list re-exported from doc-engine-core (sprint 1 issue E-S1.6).
- Sanitization whitelist + `sanitizeRichText` are the **single shared gate** between BE and FE — import from the Angular-free `@portfolio/shared/features/rte-core`. (They were deliberately split out of the Angular renderer lib so importing them here does not bundle Angular into the Node API.)
- `isomorphic-dompurify` already pulled in by `rte-core` (task 308); reuse the dep. No Angular dependency in this module.
- Validate cold-start time after this lands (epic risk R: "BE Tiptap headless adds bundle weight ~150KB Node-side").
- Test patterns: see `.context/testing-guide.md` and the be-test skill output gates in personal memory.

**Specialized Skill:** be-test — for the spec files of `RichTextService` and the touched command handlers.

## Files to Touch
- `apps/api/src/modules/shared/rich-text/` (new)
- `apps/api/src/modules/profile/**/commands/*.handler.ts`
- `apps/api/src/modules/project/**/commands/*.handler.ts`
- `apps/api/src/modules/blog-post/**/commands/*.handler.ts`
- `apps/api/src/modules/experience/**/commands/*.handler.ts`
- Entity setters for the rich field groups in each module's domain layer

## Dependencies
- 305-rte-prisma-migrations
- 306/307 — for the shared `EditorDocument` type, now sourced from the Angular-free `rte-core` (type-only; no runtime Angular dep)
- 308-rte-renderer-lib (delivers `rte-core` with `RICH_TEXT_WHITELIST` + `sanitizeRichText`)
- External: doc-engine-core v0.1.0 with `generateHTML` + extensions + `migrateDoc` re-exports.

## Complexity: M

## Progress Log
- [2026-06-23] Started. Using be-test skill for the spec files (per Technical Notes).
- [2026-06-23] Verified external dep doc-engine-core v0.1.1 exports: `migrateDoc` (sync), `generateHTML(doc, extensions?)` — **async, returns `Promise<string>`** — `LATEST_SCHEMA_VERSION = 1`, `defaultExtensions: Extensions`, `EditorDocument`. AC signature adjustment: `toCanonicalForm`/`toCanonicalFormTranslatable` must be **async** (generateHTML is async via lazy happy-dom/`@tiptap/html` import).
- [2026-06-23] Scope decision (user): "Engine + Profile reference" — Phase 1 (service) full; Phase 2 wires ONLY Profile.bioLong end-to-end as the reference; the other 4 modules' handler/DTO/integration wiring deferred to task 311.
- [2026-06-23] **Phase 1 done.** Built `apps/api/src/modules/shared/rich-text/` — `RichTextService` (toCanonicalForm + toCanonicalFormTranslatable), `RichTextModule` (non-global, exported), barrel. All 9 rich-field groups are bilingual → translatable variant is the workhorse; single variant is the per-locale building block. `apps/api` (scope:api) confirmed allowed to import rte-core + doc-engine-core (only `-angular` banned).
- [2026-06-23] Test infra note: api jest (`testEnvironment: node`, transforms only `uuid`) cannot load doc-engine-core (ESM) nor rte-core's sanitizer (→ jsdom → `@exodus/bytes` ESM). Per the task-307 precedent, the service spec mocks both heavy deps and tests the service's own logic (migrate→generate→sanitize wiring, triple shape, single-schemaVersion assembly, warn-on-strip). 5/5 pass. tsc (`tsconfig.app.json --noEmit`) PASS, eslint clean.
- [2026-06-23] **Phase 2 done (Profile reference).** Wired Profile.bioLong end-to-end:
  - `EditorDocumentSchema` + `BilingualEditorDocumentSchema` (zod v4) in `rich-text/rich-text.schema.ts` (reusable by the 4 deferred modules in 311).
  - `Profile.updateBioLongRichText(json, html, version, userId)` — immutable atomic 3-value mutator.
  - `IProfileRepository.updateBioLongRichText(...)` + impl (Prisma JSONB cast, mirrors `updateIdentity`).
  - `UpdateProfileIdentitySchema.bioLongJson` optional (additive; legacy markdown `bioLong` stays). Handler injects `RichTextService`, runs `toCanonicalFormTranslatable(..., 'profile.bioLong')` → persists triple when present; identity-only path unchanged when absent.
  - `ProfileModule` imports `RichTextModule`.
  - Tests added to `profile-commands.spec.ts` (mock the ESM service module; inject a stub): absent→no rich call; present→service called with docs+'profile.bioLong' + repo persists the triple alongside identity. 33/33 api specs pass.
- [2026-06-23] **`nx build api` PASS** — webpack bundles the ESM `document-engine-core` into the CommonJS Nest build cleanly (runtime/bundle concern from epic risk R cleared functionally; cold-start timing still a follow-up to eyeball after deploy).
- [2026-06-23] **Runtime fix (webpack).** `nx build api` compiled fine but `node dist/apps/api/main.js` crashed with `ERR_UNSUPPORTED_DIR_IMPORT`: doc-engine-core@0.1.1 is `"type":"module"` with no `exports` map and uses extensionless directory imports (`export * from './constants'`) in its own source, which Node's strict ESM loader rejects — and Nx's default build externalizes it (left to Node at runtime). Fix in `apps/api/webpack.config.js`: `externalDependencies:'none'` + `mergeExternals:true` + a custom `externals` fn that **bundles only `@phuong-tran-redoc/document-engine-core`** (webpack resolves its directory imports) while keeping everything else external. `@tiptap/*`/happy-dom stay external (Node 24 `require()`-of-ESM verified working). Static verify: rebuilt bundle has **0** external requires of doc-engine-core (inlined) and retains `require("@tiptap/html"|"@prisma/client"|"@nestjs/core")`. `generatePackageJson` unaffected (derives deps from the Nx project graph). ⚠️ Needs a `nx serve api` **restart** (running webpack --watch doesn't pick up config changes).
- [2026-06-24] Follow-up bug + fix: the first externals fn was too broad — it externalized **workspace libs** (`@portfolio/*`, which are tsconfig path aliases to lib source, not node_modules), so runtime threw `Cannot find module '@portfolio/shared/errors'`. Nx's default `nodeExternals` allowlists workspace libs (bundles them); the custom fn must do the same. Fixed: bundle `@portfolio/*` + relative/absolute + doc-engine-core; externalize only real node_modules. **Runtime confirmed:** `node dist/apps/api/main.js` (dev build) boots the full Nest app — all modules incl. RichTextModule + ProfileModule initialize, routes mapped, no ESM/resolution errors.
- [2026-06-23] Done for the agreed "Engine + Profile reference" scope. See **Deferred** below for the remaining 4 modules.
- [2026-06-24] Pre-commit code review fixes (both confirmed via tsc + 34/34 specs):
  - **W1 (atomicity):** the handler did two independent Prisma writes (`updateIdentity` then `updateBioLongRichText`) — partial-write risk. Consolidated: dropped the standalone `updateBioLongRichText` repo method + port signature; `updateIdentity` now takes an optional `bioLongRichText?: ProfileBioLongRichText` and folds the triple into the one `prisma.profile.update` (same row → atomic). Handler computes the triple first, then a single write.
  - **W2 (error shaping):** `RichTextService.toCanonicalForm` ran `migrateDoc`/`generateHTML` with no try/catch → a structurally-bad-but-envelope-valid doc (or an unregistered `schemaVersion`) surfaced as a raw 500. Now caught + rethrown as `BadRequestError` (400, `CommonErrorCode.VALIDATION_ERROR`, field name in message, cause in remarks). New service spec test covers it.
  - Entity setter `Profile.updateBioLongRichText` kept as the documented domain mutator for the deferred 311 wiring (reviewer-cleared; not on the write path for the reference handler, which persists the canonical triple directly).
- [2026-07-01] **Webpack workaround removed (DE-014 landed).** `document-engine-core@0.1.2` fixes the ESM packaging at the source (rollup-bundled single Node-ESM entry + `exports` map), so `apps/api/webpack.config.js` is back to the default Nx Node build — dropped `externalsExceptDocumentEngine`, `externalDependencies:'none'`, `mergeExternals`. core is now externalized (`require(...)` at runtime, in dist deps). Also simplified `markdown-to-doc.ts` to a plain `await import('@tiptap/html/server')` (ambient shim added for node10 subpath resolution), which puts `@tiptap/html` in the api's dist deps. `node dist/apps/api/main.js` boots the full app, no `ERR_UNSUPPORTED_DIR_IMPORT`. Details in document-engine DE-014.
