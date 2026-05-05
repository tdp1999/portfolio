# Epic: Rich-Text Editor Integration (`redoc-rte`)

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: broken-down (2026-05-05). 15 tasks created (305–319) in `.context/tasks/`.
> Depends on: `epic-portfolio-e2-content-scaffolding`, `epic-portfolio-e5-implementation` (Phases 1–4 complete).
> Feeds: future content authoring (E5 Phase 6, blog post body, project case-study body).
> External dependency: `document-engine` repo (`C:\study\document-engine`) — see [Sprint 1 / Sprint 2 issue list](#external-dependencies-document-engine-repo).

## Purpose

Replace ad-hoc textarea-with-parser patterns (`taglineSplit`, `coreStack`, `parseBioLong`, `convertObsidianMarkdown`, custom regex sanitization) with a disciplined rich-text pipeline that:

1. Uses an in-house Tiptap-based editor (`@phuong-tran-redoc/document-engine-angular`, hereafter "**E**") for long-form content.
2. Uses CommonMark Markdown for short-form content (taglines, intros, footers).
3. Stores rich content as **JSON AST canonical + sanitized HTML cache**, with `schema_version` for safe migrations.
4. Decouples editor implementation from consumers via an abstract `RichTextEditor` token (`redoc-rte`), so the underlying engine can be swapped without rewriting call sites.
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
| `Profile.bioLong` | **`redoc-rte` (E, semantic-only)** | ~450 từ, italic/bold/list essential |
| `Project.body` (case study) | **`redoc-rte` (E, full config)** | ~1500 từ, image-ref blocks, code blocks |
| `TechnicalHighlight.challenge/approach/outcome` | **`redoc-rte` (E, semantic-only)** | ~150 từ × 3, italic/bold/list |
| `Experience.description/responsibilities/highlights` | **`redoc-rte` (E, semantic-only)** | Lists + emphasis |
| `BlogPost.content` | **`redoc-rte` (E, full config)** | Long-form, code blocks, images |
| `Project.oneLiner`, `Project.description` | Markdown plain text | <300 chars per field |
| Identity, social links, URLs, structured arrays | Plain inputs / structured JSON | No prose |

**Multi-template safety**: every field above carries semantic content only. Editor config disables color, font-size, alignment, raw HTML — these are presentation concerns owned by landing UI.

### Hidden contract minimization

- **Markdown fields**: contract = "CommonMark semantic subset" (industry standard, lossless).
- **JSON fields**: contract = "Tiptap JSON with semantic-only marks" (italic/bold/u/s/code, headings h2-h4, lists, links, blockquote, code-block, image-ref). **No** TextStyle/Color/FontSize/Alignment extensions enabled.
- Custom blocks marked via `data-block="image-ref"` + `data-image-id="..."` on semantic HTML elements (figure/span). Landing renderer hydrates by `data-block` attribute, never by class.

### DI / swap-ability

```
libs/shared/redoc-rte/             — contract (token, abstract CVA, EditorDocument type, ToolbarConfig enum)
libs/shared/redoc-rte-tiptap/      — concrete impl wrapping E
libs/shared/redoc-rte-renderer/    — SSR-safe read-side renderer (innerHTML + DOMPurify pipe)
libs/shared/redoc-rte-textarea/    — fallback impl, plain textarea (test/dev)
```

Console `app.config.ts`:
```ts
provide(REDOC_RTE_EDITOR, RedocRteTiptapComponent)
```

Concrete impl never leaks into consumer code. Swapping to Quill/Lexical = new concrete impl + provider change.

### Sanitization whitelist (initial — extend per content need)

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

External work in `C:\study\document-engine`. Until this lands, portfolio side is blocked.

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

Old `*` (string/markdown) columns remain through expand/contract. Drop in a follow-up migration after backfill confirms zero referencing reads.

Exit: migration applied to dev DB, Prisma client regenerated, all repos return both old and new fields side-by-side.

### Phase 3 — `redoc-rte` shared libs

Generate via `ng-lib` skill:

- `libs/shared/redoc-rte` (contract): `EditorDocument` type, `REDOC_RTE_EDITOR` token, abstract `RedocRteEditorComponent extends ControlValueAccessor`, `ToolbarConfig` enum, `EditorMode` ('semantic' | 'full').
- `libs/shared/redoc-rte-tiptap` (concrete): `RedocRteTiptapComponent` wrapping E, `tiptapExtensionsFor(mode)` factory, `MEDIA_PICKER_HOOK` token.
- `libs/shared/redoc-rte-renderer` (read-side): `<redoc-rte-render>` component with `[innerHTML]="html | safeHtml"`, `SafeHtmlPipe` running DOMPurify with shared whitelist.
- `libs/shared/redoc-rte-textarea` (fallback): plain textarea concrete impl satisfying contract. For tests, SSR fallback, future debug.

Both concrete impls implement CVA — `formControlName` works seamlessly.

Exit: contract published in tsconfig path mappings, console can `provide(REDOC_RTE_EDITOR, RedocRteTiptapComponent)`.

### Phase 4 — BE rich-text service

`apps/api/src/modules/shared/rich-text/`:

- `RichTextService.toCanonicalForm(json: EditorDocument): { json: EditorDocument, html: string, schemaVersion: number }` — runs `migrateDoc`, `generateHTML`, `DOMPurify.sanitize`.
- `RICH_TEXT_WHITELIST` constant exported, shared with FE pipe.
- Module imported by Profile, Project, BlogPost, Experience modules. Each command handler that accepts a rich field calls the service before persisting.

Exit: writing a JSON to DB also writes sanitized HTML, all in one transaction.

### Phase 5 — Console editor swap

`libs/console/shared/ui/markdown-editor/` is currently a façade with a textarea placeholder. Swap concrete to `RedocRteTiptapComponent`:

- Refactor `console-markdown-editor` → `console-rich-text-editor`. Old `markdown-editor` selector kept as deprecated alias for one release.
- Wire `MEDIA_PICKER_HOOK` to existing `MediaPickerDialog`.
- Update form pages: blog `post-form-page`, project `project-form-page` (body + highlights), profile `identity-section` (bioLong), experience `experience-form-page` (description, responsibilities, highlights).
- All form submits now send JSON, not markdown.
- BE response on read returns JSON for edit pages, HTML for landing read pages.

Exit: every console form page using a rich field renders the new editor; saves succeed; reload renders edits intact.

### Phase 6 — Landing renderer

Replace ad-hoc parsers in landing components:

- `home-intro.component.ts` — drop `parseBioLong`, render `<redoc-rte-render [html]="profile.bioLongHtml.en">`.
- `home-stack.component.ts` (when 285b lands) — same pattern for stackIntro, but `stackIntro` is Markdown-only (Phase 8), uses `MarkdownPipe` not RTE renderer.
- Future `project-detail.component.ts` (task 290) — render `body`, `highlights[*].challenge/approach/outcome` via renderer.
- Blog `post-detail.component.ts` — replace `marked.parse(content)` with `<redoc-rte-render [html]="post.contentHtml">`.
- SSR: renderer is server-safe (no Tiptap, no `window`); HTML already sanitized at write-time, pipe sanitizes again.

Exit: every landing page that previously called a custom parser now consumes pre-sanitized HTML.

### Phase 7 — Image-ref + MediaPicker integration

Activates `image-ref` node only on fields that need it (Project.body, BlogPost.content). Editor toolbar shows Image button → click triggers `MEDIA_PICKER_HOOK` → opens `MediaPickerDialog` → resolves `{ id, url, alt, width, height }` → editor inserts `<figure data-block="image-ref" data-image-id="..." data-caption-position="bottom">`.

Renderer recognizes `data-block="image-ref"`, fetches Media metadata, renders `landing-figure` component (responsive `<picture>` + caption).

**Scope**: Project.body + BlogPost.content only. Other fields (Profile.bioLong, Experience descriptions) keep image disabled.

Exit: blog post can embed an image picked from MediaPicker; renders correctly on public page.

### Phase 8 — Markdown for short fields (Q8 Option C)

Delete custom parsers, replace with CommonMark via `marked`:

- `taglineSplit()` → drop. Tagline interpreted by hero UI via paragraph break + `<em>` semantic.
- `coreStack()` → drop. Stack intro rendered as paragraphs; Tier 2 pills come from `Skill.displayGroup` (already structured).
- `parseBioLong()` → drop (replaced by Phase 6 RTE renderer for Profile.bioLong).
- `convertObsidianMarkdown()` + `extractTitleFromMarkdown()` + `renderMarkdownPreview()` → kept as one-shot Obsidian importer; on import, convert MD → Tiptap JSON via `prosemirror-markdown`, store JSON+HTML as canonical. Markdown utilities deleted from runtime.

`libs/landing/shared/util/` gains a `MarkdownPipe` (`text | markdown`) wrapping `marked.parse` + DOMPurify for short Markdown fields.

Exit: 7 custom parsers deleted; landing reads short fields through `MarkdownPipe`, long fields through `<redoc-rte-render>`.

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
- [ ] `libs/shared/redoc-rte` (+ 3 concrete impls) shipped, contract documented.
- [ ] `RichTextService` in BE generates HTML + sanitizes on every write.
- [ ] Every console form page using a rich field renders `RedocRteTiptapComponent` via DI token (no hard import of E in form pages).
- [ ] `home-intro` no longer calls `parseBioLong`; renders via `<redoc-rte-render>`.
- [ ] Blog post content renders via `<redoc-rte-render>`, not `marked.parse`.
- [ ] Image picked in editor displays correctly on public blog page (Phase 7).
- [ ] Custom parsers (`taglineSplit`, `coreStack`, `parseBioLong`, `convertObsidianMarkdown`, `renderMarkdownPreview`, `extractTitleFromMarkdown`, `extractH1Title`) deleted from runtime (Obsidian importer kept as one-shot tool).
- [ ] No `[innerHTML]` binding in landing or console without `| safeHtml` pipe.
- [ ] No `bypassSecurityTrustHtml` call without preceding DOMPurify sanitize.
- [ ] No `import { ... } from '@phuong-tran-redoc/document-engine-angular'` outside `libs/shared/redoc-rte-tiptap`.
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
- ~~DI architecture?~~ → token + abstract CVA + 3 concrete impls under `libs/shared/redoc-rte*` (Q9).
- ~~Lib name?~~ → `redoc-rte` (Q9).
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
- `C:\study\document-engine\` — external repo, see `package.json` for current version
- [Tiptap output guide](https://tiptap.dev/docs/guides/output-json-html)
- [ProseMirror schema migration discussion](https://discuss.prosemirror.net/t/schema-versioning-and-migrations/321)
- [Ghost's Lexical migration story](https://ghost.org/docs/architecture/) (reference for JSON-canonical + HTML-cache pattern)
