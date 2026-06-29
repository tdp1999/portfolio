# Epic: Rich-Text Editor Integration (`rte-contract`)

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: broken-down (2026-05-05). 15 tasks created (305–319) in `.context/tasks/`.
> Depends on: `epic-portfolio-e2-content-scaffolding`, `epic-portfolio-e5-implementation` (Phases 1–4 complete).
> Feeds: future content authoring (E5 Phase 6, blog post body, project case-study body).
> Followed by: [`epic-portfolio-prose-block-renderer`](./epic-portfolio-prose-block-renderer.md) (`redoc-blocks`) — opens AFTER this epic ships; replaces the Phase 6/7 `[innerHTML]` + `data-block` read-path with an AST renderer + block registry once a 2nd block type is needed. The Phase 6/7 approach here is the sanctioned interim for the single `image-ref` block.
> External dependency: `document-engine` repo (sibling working directory) — its v0.1.0 release ships these. See [Sprint 1 / Sprint 2 issue list](#external-dependencies-document-engine-repo). That repo tracks this work as its own epic `epic-document-engine-v0.1.0-stable-release.md` (tasks `de-001`…`de-009`); `de-002/003/004` define the JSON shape, `de-008` publishes.

## Purpose

Replace ad-hoc textarea-with-parser patterns (`taglineSplit`, `coreStack`, `parseBioLong`, `convertObsidianMarkdown`, custom regex sanitization) with a disciplined rich-text pipeline that:

1. Uses an in-house Tiptap-based editor (`@phuong-tran-redoc/document-engine-angular`, hereafter "**E**") for long-form content.
2. Uses CommonMark Markdown for short-form content (taglines, intros, footers).
3. Stores rich content as **JSON AST canonical + sanitized HTML cache**, with `schema_version` for safe migrations.
4. Decouples editor implementation from consumers via an abstract `RichTextEditor` token (`rte-contract`), so the underlying engine can be swapped without rewriting call sites.
5. Renders read-side HTML SSR-safely with two-layer DOMPurify sanitization (write + read).

## Non-goals

- **Multi-template landing variants**: design supports it (semantic-only content), but only one landing template ships in V1.
- **Markdown round-trip** (JSON → MD → JSON): one-shot import only (Obsidian → JSON, then JSON forever).
- **Collaborative editing, comments, mentions, track changes**: deferred indefinitely.
- **Image upload UI inside editor**: integrates with existing `MediaPickerDialog` via async callback (Phase 7).
- **Backfill of existing rich content**: no production content exists yet; lazy migration on next-edit suffices.

## Architectural decisions (locked 2026-05-04 via Q&A drill)

### Output contract — JSON + HTML

Each rich field gets **3 columns** in Prisma:

```prisma
model BlogPost {
  contentJson           Json      // canonical, edited by E
  contentHtml           String    @db.Text  // sanitized cache, rendered by landing SSR
  contentSchemaVersion  Int       @default(1)
}
```

**Write-time** (admin saves): BE receives `contentJson` → `generateHTML()` (Tiptap headless, Node-safe) → `DOMPurify.sanitize()` (server-side, `isomorphic-dompurify`) → persist all 3 columns.

**Read-time landing**: `[innerHTML]="contentHtml | safeHtml"` (pipe runs DOMPurify lap 2 — belt + braces). **No Tiptap loaded on landing read path.**

**Read-time console edit**: load `contentJson` → run `migrateDoc(json, schemaVersion)` → push into editor instance.

### Lazy schema migration

E ships a registry of pure functions:

```ts
// @phuong-tran-redoc/document-engine-core
export const docMigrations = { 1: (v1) => v2, 2: (v2) => v3, ... };
export function migrateDoc(doc): LatestDoc { /* walk registry */ }
```

Consumer (portfolio) ships glue script `apps/api/scripts/migrate-rich-text.ts` exposed as `pnpm migrate:editor`. **Lazy by default** (migrate on next edit). Batch backfill only when E ships a render-breaking change (cross that bridge later).

### Format strategy per field (Q8 option C)

| Field | Strategy | Rationale |
|---|---|---|
| Tagline, stackIntro, contactIntro, footerTagline | **Markdown plain text** (CommonMark subset: bold/italic/link) | <200 chars, edit hiếm, E overkill, parser custom hiện tại là smell |
| `Profile.bioLong` | **`rte-contract` (E, semantic-only)** | ~450 từ, italic/bold/list essential |
| `Project.body` (case study) | **`rte-contract` (E, full config)** | ~1500 từ, image-ref blocks, code blocks |
| `TechnicalHighlight.challenge/approach/outcome` | **`rte-contract` (E, semantic-only)** | ~150 từ × 3, italic/bold/list |
| `Experience.description/responsibilities/highlights` | **`rte-contract` (E, semantic-only)** | Lists + emphasis |
| `BlogPost.content` | **`rte-contract` (E, full config)** | Long-form, code blocks, images |
| `Project.oneLiner`, `Project.description` | Markdown plain text | <300 chars per field |
| Identity, social links, URLs, structured arrays | Plain inputs / structured JSON | No prose |

**Multi-template safety**: every field above carries semantic content only. Editor config disables color, font-size, alignment, raw HTML — these are presentation concerns owned by landing UI.

### Hidden contract minimization

- **Markdown fields**: contract = "CommonMark semantic subset" (industry standard, lossless).
- **JSON fields**: contract = "Tiptap JSON with semantic-only marks" (italic/bold/u/s/code, headings h2-h4, lists, links, blockquote, code-block, image-ref). **No** TextStyle/Color/FontSize/Alignment extensions enabled.
- Custom blocks marked via `data-block="image-ref"` + `data-image-id="..."` on semantic HTML elements (figure/span). Landing renderer hydrates by `data-block` attribute, never by class.

### DI / swap-ability

```
libs/shared/features/rte-core/         — Angular-free shared values (EditorDocument + EditorMode types, RICH_TEXT_WHITELIST, sanitizeRichText) imported by BOTH the Angular FE and the Node BE at runtime
libs/shared/features/rte-contract/     — Angular DI contract (RTE_EDITOR token, abstract RteEditor CVA, ToolbarConfig enum)
libs/shared/features/rte-tiptap/       — concrete impl wrapping E
libs/shared/features/rte-renderer/     — SSR-safe read-side renderer (innerHTML + DOMPurify pipe)
libs/shared/features/rte-textarea/     — fallback impl, plain textarea (test/dev)
```

The framework-agnostic bits (the `EditorDocument`/`EditorMode` types, the `RICH_TEXT_WHITELIST` constant, and the `sanitizeRichText` function) live in the new Angular-free `rte-core` lib so the Node BE can import them at runtime without bundling Angular. The Angular DI contract (`RTE_EDITOR` token, abstract `RteEditor`) stays in `rte-contract`.

Console `app.config.ts`:
```ts
provide(RTE_EDITOR, RteTiptapEditor)
```

Concrete impl never leaks into consumer code. Swapping to Quill/Lexical = new concrete impl + provider change.

### Sanitization whitelist (initial — extend per content need)

`RICH_TEXT_WHITELIST` and `sanitizeRichText` live in the Angular-free `rte-core` lib (built on `isomorphic-dompurify`). Both the renderer's `SafeHtmlPipe` and the BE `RichTextService` import them from `@portfolio/shared/features/rte-core` — the BE (NestJS, Node) must use the whitelist + sanitizer without bundling Angular, which it could not do if they lived in the Angular renderer lib.

```ts
ALLOWED_TAGS = [
  'p', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'figure', 'figcaption',
  'strong', 'em', 'u', 's',
  'a', 'br', 'span',
];
ALLOWED_ATTR = ['href', 'target', 'rel', 'data-block', 'data-image-id', 'data-variant'];
// DOMPurify hook: force target="_blank" + rel="noopener nofollow" on <a>
```

## External dependencies (`document-engine` repo)

Coordinated upgrade required before portfolio integration begins. Upon completion, E publishes as `0.1.0` (graduation from MVP versioning).

### Sprint 1 — Blocking (must ship before Phase 2)

| # | Issue | File(s) | Notes |
|---|---|---|---|
| E-S1.1 | Bump peer Angular range to `>=14 <22` | `libs/document-engine-angular/package.json` | Portfolio is 21.1, current peer caps at `<21` |
| E-S1.2 | Setup Changesets (`@changesets/cli`), seed CHANGELOG.md, document release flow | repo root + `.changeset/` | Required for disciplined semver |
| E-S1.3 | Rename Vietnamese variables in RestrictedEditing extension to English | `libs/document-engine-core/src/extensions/restricted-editing/` | Code quality + future contributors |
| E-S1.4 | Add `image.onPick: () => Promise<MediaResult>` async config hook | `libs/document-engine-angular/src/lib/views/image-insert-view/` + config types | Enables MediaPicker integration |
| E-S1.5 | Add `image-ref` custom node type (semantic figure with `data-image-id`) | `libs/document-engine-core/src/nodes/image-ref.node.ts` | Decouples content from media URL |
| E-S1.6 | Re-export headless `generateHTML` + extension list from public API | `libs/document-engine-core/src/index.ts` | Required for BE Node-side HTML generation |
| E-S1.7 | Add `schemaVersion: number` field on document root + `docMigrations` registry + `migrateDoc()` helper | `libs/document-engine-core/src/migrations/` | Future-proof against breaking schema changes |

**Release**: bump version `0.0.41` → `0.1.0` after sprint 1 closes. Publish to npm.

### Sprint 2 — Polish (can ship after portfolio Phase 7)

| # | Issue | File(s) | Notes |
|---|---|---|---|
| E-S2.1 | Fix README: output event `(ready)` → `(editorReady)` | `libs/document-engine-angular/README.md:162-166` | Doc bug |
| E-S2.2 | Fix README peer-dep example (Angular 17/18 → match new range) | `libs/document-engine-angular/README.md:39-43` | Doc consistency |
| E-S2.3 | Replace `#` placeholder links in READMEs with real targets | both READMEs | Link to CHANGELOG, demo, etc. |

### Deferred (not in this epic)

- Storybook / live demo site
- Markdown round-trip extension
- Mentions, comments, collab

## Phases

### Phase 1 — `document-engine` Sprint 1

External work in the `document-engine` repo — tracked there as epic `epic-document-engine-v0.1.0-stable-release.md` (tasks `de-001`…`de-009`). Until v0.1.0 publishes to npm, the portfolio side is blocked.

Exit: E v0.1.0 published to npm with all 7 Sprint 1 issues closed.

### Phase 2 — Prisma schema migrations

Use `prisma-migrate` skill. Single migration set adding 3 columns per rich field:

| Model | Field group | New columns |
|---|---|---|
| `Profile` | bioLong | `bioLongJson`, `bioLongHtml`, `bioLongSchemaVersion` (per locale handled inside JSONB) |
| `Project` | body | `bodyJson`, `bodyHtml`, `bodySchemaVersion` |
| `BlogPost` | content | `contentJson`, `contentHtml`, `contentSchemaVersion` |
| `TechnicalHighlight` | challenge / approach / outcome | 9 columns total (3 per sub-field) |
| `Experience` | description / responsibilities / highlights | 9 columns total |

**Translatable fields**: JSON contains `{ en: EditorDocument, vi: EditorDocument }`. HTML cache contains `{ en: string, vi: string }` (also JSONB). Schema version is single int per field group.

Old `*` (string/markdown) columns remain through expand/contract. Drop in a follow-up migration after backfill confirms zero referencing reads — tracked as **task 363** (`363-rte-drop-legacy-prose-columns`).

Exit: migration applied to dev DB, Prisma client regenerated, all repos return both old and new fields side-by-side.

### Phase 3 — `rte-contract` shared libs

Generate via `ng-lib` skill:

- `libs/shared/features/rte-core` (Angular-free shared values): `EditorDocument` + `EditorMode` ('semantic' | 'full') types, `RICH_TEXT_WHITELIST` constant, `sanitizeRichText(html, whitelist?)` (built on `isomorphic-dompurify`). Imported by BOTH the Angular FE and the Node BE at runtime — no Angular dependency.
- `libs/shared/features/rte-contract` (contract): `RTE_EDITOR` token, abstract `RteEditor extends ControlValueAccessor`. Re-uses the `EditorDocument`/`EditorMode` types from `rte-core`. The framework-agnostic bits (types, whitelist, sanitize) now live in `rte-core`; only the Angular DI contract lives here.
- `libs/shared/features/rte-tiptap` (concrete): `RteTiptapEditor` wrapping E, `documentEngineConfigFor(mode)` factory (returns `Partial<DocumentEngineConfig>` — the delivered engine builds extensions from a config flag object, not a raw extension array), `MEDIA_PICKER_HOOK` token (reuses engine `ImagePickHook`/`MediaResult`).
- `libs/shared/features/rte-renderer` (read-side): `<rte-render-html>` component with `[innerHTML]="html | safeHtml"`, `SafeHtmlPipe` running `sanitizeRichText` (from `rte-core`) then `bypassSecurityTrustHtml`.
- `libs/shared/features/rte-textarea` (fallback): plain textarea concrete impl satisfying contract. For tests, SSR fallback, future debug.

Both concrete impls implement CVA — `formControlName` works seamlessly.

Exit: contract published in tsconfig path mappings, console can `provide(RTE_EDITOR, RteTiptapEditor)`.

### Phase 4 — BE rich-text service

`apps/api/src/modules/shared/rich-text/`:

- `RichTextService.toCanonicalForm(json: EditorDocument): { json: EditorDocument, html: string, schemaVersion: number }` — runs `migrateDoc`, `generateHTML`, then `sanitizeRichText` (imported from `@portfolio/shared/features/rte-core`).
- `RICH_TEXT_WHITELIST` + `sanitizeRichText` imported from `rte-core` (the Angular-free lib), shared with the FE renderer pipe. The BE imports them without bundling Angular.
- Module imported by Profile, Project, BlogPost, Experience modules. Each command handler that accepts a rich field calls the service before persisting.

Exit: writing a JSON to DB also writes sanitized HTML, all in one transaction.

### Phase 5 — Console editor swap

`libs/console/shared/ui/markdown-editor/` is currently a façade with a textarea placeholder. Swap concrete to `RteTiptapEditor`:

- Refactor `console-markdown-editor` → `console-rich-text-editor`. Old `markdown-editor` selector kept as deprecated alias for one release.
- Wire `MEDIA_PICKER_HOOK` to existing `MediaPickerDialog`.
- Update form pages: blog `post-form-page`, project `project-form-page` (body + highlights), profile `identity-section` (bioLong), experience `experience-form-page` (description, responsibilities, highlights).
- All form submits now send JSON, not markdown.
- BE response on read returns JSON for edit pages, HTML for landing read pages.

Exit: every console form page using a rich field renders the new editor; saves succeed; reload renders edits intact.

### Phase 6 — Landing renderer

Replace ad-hoc parsers in landing components:

- `home-intro.component.ts` — drop `parseBioLong`, render `<rte-render-html [html]="profile.bioLongHtml.en">`.
- `home-stack.component.ts` (when 285b lands) — `stackIntro` is a short field, not RTE: rendered via the shared declarative inline-markdown parser (`parseInlineParagraphs`), see Phase 8.
- Future `project-detail.component.ts` (task 290) — render `body`, `highlights[*].challenge/approach/outcome` via renderer.
- Blog `post-detail.component.ts` — replace `marked.parse(content)` with `<rte-render-html [html]="post.contentHtml">`.
- SSR: renderer is server-safe (no Tiptap, no `window`); HTML already sanitized at write-time, pipe sanitizes again.

Exit: every landing page that previously called a custom parser now consumes pre-sanitized HTML via `<rte-render-html>`.

### Phase 7 — Image-ref + MediaPicker integration

Activates `image-ref` node only on fields that need it (Project.body, BlogPost.content). Editor toolbar shows Image button → click triggers `MEDIA_PICKER_HOOK` → opens `MediaPickerDialog` → resolves `{ id, url, alt, width, height }` → editor inserts `<figure data-block="image-ref" data-image-id="..." data-caption-position="bottom">`.

Renderer recognizes `data-block="image-ref"`, fetches Media metadata, renders `landing-figure` component (responsive `<picture>` + caption).

**Scope**: Project.body + BlogPost.content only. Other fields (Profile.bioLong, Experience descriptions) keep image disabled.

Exit: blog post can embed an image picked from MediaPicker; renders correctly on public page.

### Phase 8 — Short fields = shared declarative inline-markdown (task 317)

**Resolved 2026-06-29 (re-scoped from the original "`marked` pipe" plan).** The `marked`
dependency was removed from the repo when the `markdown.*` services were deleted, and no short
field ever rendered via `[innerHTML]` — they already used declarative runs parsers. That
declarative model *is* the prose-block epic's D5b, so a `marked` + DOMPurify + `[innerHTML]` pipe
would have regressed away from the locked direction. The intent (one path for short inline
markdown; kill duplicated ad-hoc parsers) is kept, realised declaratively:

- `libs/landing/shared/util/inline-markdown.ts` — single shared `parseInlineRuns` /
  `parseInlineParagraphs` returning typed `InlineRun`s (`**bold**` / `*italic*`). Consumers render
  runs as real `<strong>`/`<em>` elements. **No `marked`, no DOMPurify, no `[innerHTML]`.**
- Deleted the duplicated parsers: `parseStackIntro` (home.stack) and `parseItalicRuns`
  (selected-work). `convertObsidianMarkdown`/`extractTitleFromMarkdown`/`extractH1Title`/
  `renderMarkdownPreview` were already gone.
- **Kept** `parseBioLong` — task 312 is blocked (deferred to the prose-block AST renderer, which
  keeps it until then). `taglineSplit` / `coreStack` are hero layout/token extractors, not markdown
  rendering — also kept.

Exit: duplicated short-field parsers consolidated into one shared declarative util; long fields
render through `<rte-render-html>`.

### Phase 9 — `document-engine` Sprint 2

External polish (E-S2.1–2.3). Non-blocking; can land in parallel with Phase 8 or after.

Exit: E READMEs accurate, no `#` placeholders.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| E v0.1.0 ships breaking changes affecting portfolio | All Sprint 1 changes are additive (new exports, new config fields, new node types). Existing consumers unaffected. Pin exact version in portfolio `package.json` until verified. |
| BE Tiptap headless adds bundle weight | `@tiptap/html` is ~150KB, runs Node-side only. Portfolio API server can absorb. Verify cold-start time after Phase 4. |
| DOMPurify whitelist too narrow → content lost | Start narrow, expand on demand. E2E tests for each field type catch silent strips. Add an admin-side warning when sanitization removes nodes. |
| Hydration mismatch SSR ≠ CSR for editor | Editor lazy-loaded via `@defer (on idle)` in console only. Landing never loads editor — only renders `[innerHTML]`. |
| Schema version drift between E versions across both apps | Both apps pin same E version via npm + Changesets. No version skew possible until separate consumers exist. |
| Markdown short fields lose information when migrated to RTE later | Migration is one-way (Markdown → JSON via `prosemirror-markdown` is lossless for CommonMark). If a field upgrades, write a one-shot migration. |
| Image-ref breaks if Media row deleted | Renderer falls back to broken-image placeholder + alt text. Console adds "find references" check before delete (future task). |
| `*_schema_version` migration logic untested in production | Lazy migration tests on next-edit; add unit tests for each `docMigrations[N]` entry; integration test that round-trips real fixtures. |

## Acceptance criteria

- [ ] E v0.1.0 published with all Sprint 1 issues closed.
- [ ] Prisma schema includes `*Json`, `*Html`, `*SchemaVersion` columns for every rich field.
- [ ] `libs/shared/features/rte-core` + `rte-contract` (+ 3 concrete impls) shipped, contract documented.
- [ ] `RichTextService` in BE generates HTML + sanitizes on every write (via `sanitizeRichText` from `rte-core`).
- [ ] Every console form page using a rich field renders `RteTiptapEditor` via DI token (no hard import of E in form pages).
- [ ] `home-intro` no longer calls `parseBioLong`; renders via `<rte-render-html>`.
- [ ] Blog post content renders via `<rte-render-html>`, not `marked.parse`.
- [ ] Image picked in editor displays correctly on public blog page (Phase 7).
- [ ] Custom parsers (`taglineSplit`, `coreStack`, `parseBioLong`, `convertObsidianMarkdown`, `renderMarkdownPreview`, `extractTitleFromMarkdown`, `extractH1Title`) deleted from runtime (Obsidian importer kept as one-shot tool).
- [ ] No `[innerHTML]` binding in landing or console without `| safeHtml` pipe.
- [ ] No `bypassSecurityTrustHtml` call without preceding DOMPurify sanitize.
- [ ] No `import { ... } from '@phuong-tran-redoc/document-engine-angular'` outside `libs/shared/features/rte-tiptap`.
- [ ] `pnpm migrate:editor` script exists and runs idempotently against dev DB.
- [ ] Landing SSR initial paint contains rendered HTML (no client-side editor load on read pages).
- [ ] Lighthouse perf budget on `/blog/:slug` and `/projects/:slug` ≥ 80 (existing E5 gate).

## Open questions (resolved during planning)

- ~~Consume from npm or workspace?~~ → npm, pinned exact version (Q1).
- ~~JSON, HTML, or both?~~ → both, JSON canonical, HTML cache (Q4).
- ~~Schema versioning?~~ → `schemaVersion` int + lazy migration (Q4).
- ~~Image picker?~~ → async `onPick` callback into existing MediaPicker (Q5).
- ~~Markdown round-trip?~~ → one-shot import only (Q6).
- ~~Tagline structured fields?~~ → no, keep generic Markdown (Q8).
- ~~DI architecture?~~ → token + abstract CVA + 3 concrete impls under `libs/shared/features/rte-*` (Q9).
- ~~Lib name?~~ → `rte-contract` (Q9).
- ~~Toolbar?~~ → use E default toolbar, theme via CSS vars; revisit if mismatch (Q10).
- ~~Sanitize where?~~ → BE write + FE read (belt + braces) (Q11).
- ~~SSR strategy?~~ → editor browser-only via `@defer`; landing renders sanitized HTML (Q11).
- ~~Sprint composition for E repo?~~ → 7 issues sprint 1, 3 issues sprint 2 (Q12).

## References

- `.context/plans/epic-portfolio-e2-content-scaffolding.md` — content matrix per section
- `.context/plans/epic-portfolio-e5-implementation.md` — implementation phases
- `.context/patterns-architecture.md` — DI patterns, layering rules
- `.context/patterns-error-handling.md` — sanitization handoff to ServerErrorDirective (errors are separate from content sanitization)
- `.context/design/foundations/` — typography classes that landing renderer composes
- `document-engine` repo (sibling working directory) — external package source; see its `package.json` for current version (`0.0.41` → target `0.1.0`)
- [Tiptap output guide](https://tiptap.dev/docs/guides/output-json-html)
- [ProseMirror schema migration discussion](https://discuss.prosemirror.net/t/schema-versioning-and-migrations/321)
- [Ghost's Lexical migration story](https://ghost.org/docs/architecture/) (reference for JSON-canonical + HTML-cache pattern)
