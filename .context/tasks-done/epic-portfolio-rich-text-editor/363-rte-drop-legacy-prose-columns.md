# Task 363: Rich-Text — Drop Legacy Prose Columns (Contract)

## Status: DONE (2026-07-03) — all 5 legacy prose groups dropped; migration applied; unit 408/408 + rte-contract 22/22 + tsc clean + builds green + live e2e (blog 29 / exp 21 / project 27 / profile 20) + landing /about renders from canonical. Only non-automatable follow-up: eyeball the console experience-detail page (Google-OAuth login blocks headless check).

## Blocked On (verified 2026-06-30)
A single contract migration dropping all five legacy field groups is the locked AC, but 3 of 5 groups still have **live runtime reads** off the legacy columns. Dropping now breaks landing. Prerequisites before this task can run:

1. **Profile** — land **task 312** (home-intro per-paragraph render off `bioLongJson`). Today `home.intro.ts:33` / `home.ts:72` read legacy `Profile.bioLong` via `parseBioLong`. Task 312 is itself `blocked`.
2. **Blog** — cutover read-time: landing `blog.detail.ts:141` `wordCount(p.content)` → API `readTimeMinutes` (or derive from `contentHtml`); drop `content` from the public presenter (`blog-post.presenter.ts:40,109`) + DTO; move entity `calculateReadTime` off legacy `content`. `BlogPost.content` is `NOT NULL`, so the FE plain-text derivation and the column go together.
3. **Experience** — **DECIDED 2026-07-01: rich-text with a constrained schema; render-swap folded into this task (inline), drop-legacy direction kept.** Fields stay rich but the editor allows only **lists + simple inline marks, no block elements** (no heading, no image-ref/gallery, no blockquote/code-block). This needs a landing render-swap (legacy string-array bullets → `<rte-render [doc]>` off `*Json`) + a constrained console `rte-tiptap` preset — both done **inline here** (same pattern as the Blog cutover already folded into this task, no separate task). See "Experience render-swap (folded)" below.

**Project** group is render-safe today (landing reads rich HTML) but still needs its task-311 dual-field BE/FE cleanup before its columns can drop. If we later choose to split, Project is the only group shippable now.

## Phased execution (locked 2026-07-01)

To keep the destructive migration atomic and last, 363 runs in ordered phases — the drop only fires after **all** read paths are cut over:

1. **Cutover reads** (gate — must all land before any drop):
   - **Profile** → land **task 312** (home-intro AST render off `bioLongJson`). External dep; 312 is now hardware-unblocked (prose-block-renderer shipped `<rte-render [doc]>`), status `ready`.
   - **Blog** → inline cutover: `wordCount(p.content)` → API `readTimeMinutes`; drop `content` from public presenter (`blog-post.presenter.ts:40,109`) + DTO; move entity `calculateReadTime` off legacy `content`.
   - **Experience** → inline render-swap (see below).
   - **Project** → render-safe already.
2. **Dual-field cleanup** — remove the legacy side of all five 311 dual-write pairs (FE types / DTO / entity / mapper / repo).
3. **Contract migration** — one migration drops the legacy columns for all five groups.
4. **Verify** — Prisma client regen, type-check, build, seed, relevant specs + e2e green.

### Experience render-swap (folded)

- **Landing:** replace the legacy string-array bullet render (`about.experience.util.ts:18-19`, `about.experience.html:180-198`) with `<rte-render [doc]>` reading the `*Json` canonical. AST here is trivial — paragraph + list + inline marks only, all handled declaratively by `rte-element`/`rte-inline`; **no block-renderer registration needed** (this is the simplest consumer of the new renderer).
- **Console:** add a **constrained `rte-tiptap` preset** for the Experience fields — enable paragraph + bullet/ordered list + marks (bold/italic/link/code/underline/strike); **disable** heading, image-ref, gallery, blockquote, code-block. Verify whether 311 S4 currently mounts the full config (likely) and swap those fields to the constrained preset.
- **Verify:** landing `/about` experience section renders lists + marks correctly (EN + VI); console editor for Experience offers only the allowed controls.

## Goal
Complete the expand/contract migration started in task 305 by dropping the old string/markdown columns once every reader consumes the new `*Json` / `*Html` columns.

## Context
Task 305 adds `*Json` / `*Html` / `*SchemaVersion` columns alongside the legacy string/markdown columns (e.g. `Profile.bioLong`, `Project.body`, `BlogPost.content`, `TechnicalHighlight.*`, `Experience.*`) and leaves the old ones in place through the expand phase. This task is the **contract** step: remove the legacy columns after backfill + cutover confirm zero referencing reads. Without it, the schema accumulates dead columns indefinitely.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 2 (expand/contract follow-up).

## Acceptance Criteria
- [x] **Every public presenter of an RTE field emits `<field>Canonical`** (user contract, 2026-07-02). Added `descriptionCanonical`/`responsibilitiesCanonical`/`highlightsCanonical` to experience presenter; `challengeCanonical`/`approachCanonical`/`outcomeCanonical` to project (TH) presenter. Enforced by `rte-canonical-contract.spec.ts` "RTE presenter canonical contract" block (scans every `*.presenter.ts`: any emitted `<field>Json` for a schema RTE field must have a sibling `<field>Canonical`). 22 tests green.
- [x] Confirm no runtime read path references any legacy prose column (grep repos, DTOs, landing renderers, importer). — `tsc -p apps/api/tsconfig.app.json` EXIT 0 against the dropped-column client + live e2e green + `/about` renders from canonical.
- [~] ~~Confirm all rows backfilled~~ **N/A per user (2026-07-02): no backfill.** Dev post/exp data is throwaway; prod authored fresh via console (dual-write + canonical live). Drop runs against dev directly.
- [x] Remove the legacy/`*Json` dual fields that task 311 introduced — Phase 3 (all 5 groups; see progress log 2026-07-02/03).
- [x] Single contract migration drops the legacy columns for all five field groups — Phase 4 (`drop_legacy_prose_columns`).
- [x] Prisma client regenerates; type-check + build clean; seed succeeds (seed stripped of legacy prose per user).
- [x] Migration applied to dev DB without data loss (authored content lives in the kept `*Canonical` columns; only throwaway plain columns dropped).

### 311 dual-field cleanup (FE + DTO shape)
Task 311 kept legacy markdown fields **alongside** the new `*Json` ones (optional, dual-write) so landing could keep rendering until 312–314. Once landing reads `*Json`, drop the legacy side of each pair:

All five field groups now dual-write (legacy + `*Json`) via task 311 slices S1–S4. For each, drop the legacy side:

- [ ] **FE types** — keep only the `*Json` fields; remove legacy:
  - `libs/console/feature-project/src/lib/project.types.ts` — `AdminHighlight.{challenge,approach,outcome}`, `AdminProject.body`, `HighlightPayload`/create/update legacy fields (keep `*Json`, `bodyJson`).
  - `libs/console/feature-profile/src/lib/profile.types.ts` — legacy `bioLong` (keep `bioLongJson`).
  - `libs/console/feature-blog/src/lib/blog.types.ts` — `AdminBlogPostDetail.content` + `Create/UpdateBlogPostPayload.content` (keep `contentJson`). NOTE: the FE currently derives plain-text `content` from the editor to satisfy the legacy NOT-NULL column — that derivation goes away when the column is dropped.
  - `libs/console/feature-experience/src/lib/experience.types.ts` — `AdminExperience.{description,responsibilities,highlights}` + payload legacy fields (keep `*Json`).
- [ ] **DTO (BE)** — remove legacy markdown/string from schemas (drop `.optional()` transition shims): project `challenge/approach/outcome`+`body`; profile `bioLong`; blog `content` (becomes derived/dropped); experience `description/responsibilities/highlights` string fields.
- [ ] **Entity/Mapper/repo** — stop writing legacy columns; remove rebuild-from-legacy paths:
  - project `project-highlight.mapper.ts` (`mapStoredHighlightToInput`), `highlightRichData` legacy writes, `project.mapper.ts` legacy `body`.
  - blog `blog-post.entity.ts` (`content` field + `calculateReadTime(data.content)` → derive from rich), `blog-content-rich.util.ts` stays.
  - experience legacy `description/responsibilities/highlights` writes in mapper + repo.
- [ ] **Prisma** — blog `content` is currently `String @db.Text` NOT NULL; dropping it (or making readTime derive from rich) is part of this contract migration.
- [ ] **Specs** — update `project.dto.spec.ts`, `blog-post-commands.spec.ts`, `experience-commands.spec.ts` (legacy-optional cases) to assert `*Json` is the only accepted shape.

## Remaining Work (resume plan — captured 2026-07-02 from an exhaustive code audit)

Locked decisions carried into every phase: **Experience read source = `*Canonical` + `<rte-render [doc]>`** · **no backfill** (dev data throwaway, prod authored via console) · **keep the markdown→doc IMPORT tool** (`import/markdown-to-doc.ts`, `queries/convert-markdown.query.ts`, `markdownToEditorDocument`) — that's authoring, NOT a legacy column · **keep `parseInlineRuns`** (`libs/landing/shared/util/inline-markdown.ts`) — used by `stackIntro`/`selectedWorkIntro`, which are NOT among the 5 RTE prose groups · **read-time algorithm stays `Math.ceil(words / 200)`**, sourced from canonical via `plainTextFromDoc`.

### ✅ DONE this session (kept — additive, non-destructive, 22 contract tests green)
- Experience presenter (`apps/api/src/modules/experience/application/experience.presenter.ts`): added `descriptionCanonical` / `responsibilitiesCanonical` / `highlightsCanonical` to `ExperiencePublicResponseDto` + `toPublicResponse`.
- Project presenter (`apps/api/src/modules/project/application/project.presenter.ts`): added `challengeCanonical` / `approachCanonical` / `outcomeCanonical` to `ProjectHighlightResponseDto` + `toDetail` highlight map.
- `apps/api/src/rte-canonical-contract.spec.ts`: new "RTE presenter canonical contract" describe — scans every `*.presenter.ts`; any emitted `<field>Json` for a schema RTE field must have a sibling `<field>Canonical`. Enforces the read-surface contract.
- `libs/shared/features/rte-core/src/lib/rte.portable.ts`: added `plainTextFromDoc(doc)` (flattens a PortableDocument to one plain-text string; for read-time word count off canonical).

### ⏭ PHASE 2 — Read cutover (no column drop yet; keep repo buildable)
**Blog read-time (BE) — `apps/api/src/modules/blog-post/domain/entities/blog-post.entity.ts`:**
- `calculateReadTime(content: string)` (L78-83) keep the `/200` formula but feed it plain text from canonical, not legacy markdown. Cleanest: compute read-time in the command handlers from the RichTextService canonical output (`plainTextFromDoc(rich.canonical[lang])`) and pass `readTimeMinutes` into `create`/`update`; drop the `data.content`-based calls (L106, L126).
- Publish-guard `if (!this.props.title || !this.props.content)` (L191) + update guard (L129-133): switch the "has body" check from legacy `content` to rich presence (e.g. `contentJson`/`contentCanonical` non-empty).
- Handlers: `commands/create-post.command.ts` (L49 `content`, L78 field-name — keep field-name), `commands/update-post.command.ts` (L51, L68).

**Blog read-time (landing) — `libs/landing/feature-blog/src/lib/blog-detail-page/blog.detail.ts:167`:** `wordCount(p.content)` → `p.readTimeMinutes`. Then delete `blog.detail.util.ts` `wordCount` if unused. DDL demo copies (`apps/landing/src/app/pages/ddl/ddl-blog-detail/ddl-blog-detail.{ts:163,util.ts:5}`) — decide keep-own-demo vs switch (DDL has self-contained demo data).

**Experience render-swap (landing → `*Canonical`):**
- Landing type `libs/landing/shared/data-access/src/lib/experience.types.ts`: add `descriptionCanonical` / `responsibilitiesCanonical` / `highlightsCanonical: TranslatableJson | null` (import `TranslatableJson`). Legacy `description`/`responsibilities`/`highlights` stay until Phase 3.
- VM `about.experience.types.ts`: replace `highlights`/`responsibilities: readonly string[]` with `PortableDocument | null` (`highlightsDoc`, `responsibilitiesDoc`). (`description` isn't rendered on the card today — skip unless desired.)
- `about.experience.util.ts` `toVm` (L18-19): build docs from canonical via `getLocalized(exp.highlightsCanonical, lang) as unknown as PortableDocument` + empty-guard (mirror `home.ts` `bioDoc` / project-detail `bodyDoc`).
- `about.experience.html` (L180-203): replace the `<ul><li>` loops with `<rte-render [doc]="vm.highlightsDoc">` and `<rte-render [doc]="vm.responsibilitiesDoc">`; keep the `<details>` disclosure wrapper for responsibilities. The canonical from the constrained editor is a `bulletList` → renders `<ul><li>` natively.
- `about.experience.ts`: import `RteRender` from `@portfolio/shared/features/rte-renderer` + add to `imports`.
- `about.experience.scss`: retarget `.exp-detail__highlights` / `.exp-detail__responsibilities` list styling at the `<rte-render>` output (contentClass wrapper → inner `ul`/`li`). **Needs Playwright visual verify EN+VI** — author a sample experience via admin PATCH first (like bioLong; rich cols are 0/3 locally).

**Console constrained preset (experience)** — `libs/console/feature-experience/src/lib/experience.form/experience.form.ts` (~L201-203 / 295-297): give description/responsibilities/highlights a **constrained `rte-tiptap` preset** — paragraph + bullet/ordered list + inline marks (bold/italic/link/code/underline/strike); **disable** heading, image-ref, gallery, blockquote, code-block. Verify current mount (likely full config) and swap.

**Phase 2 verify:** `nx build api` + `nx build landing`; author sample exp via `PATCH /api/admin/profile`… (experience admin endpoint); Playwright `/about` experience EN+VI + console editor shows only allowed controls.

### ⏭ PHASE 3 — Dual-field cleanup (remove legacy from code; columns still present)
Remove every legacy read/write per group (audit file:line):
- **Profile.bioLong:** `domain/value-objects/identity.ts` (getter L56, equality L71-72), `domain/entities/profile.entity.ts` (getter L106, load L292, update L360, toProps L540), `application/profile.dto.ts` (L32), `infrastructure/mapper/profile.mapper.ts` (L57 toDomain, L112 toPersistence), `application/profile.presenter.ts` (L16 legacy emit — keep bioLongCanonical L20), `infrastructure/repositories/profile.repository.ts` (L73), `application/commands/update-profile-identity.command.ts` (L50 the `bioLong: {...}` build — keep the `bioLongJson`→richText path L63), console `profile-identity.section.ts` (L104 `legacyBioLong`, L142 payload — keep `buildBioLongJson` L158), specs.
- **BlogPost.content:** entity getter L27 + create L100 (+ readtime already moved P2) + validation, `application/blog-post.dto.ts` (L22, L44, L152 `BlogPostPublicDetailDto.content`), `infrastructure/mapper/blog-post.mapper.ts` (L43, L97), `application/blog-post.presenter.ts` (L40 public, L110 admin), `infrastructure/repositories/blog-post.repository.ts` (L66), commands L49/L51, console `post.form.ts` (L171 `editorDocToPlainText`→legacy, L262-263 — keep contentJson), console `blog-post.detail.ts:54` `renderMarkdownPreview(p.content)` → render from rich; then delete `post-form-page/markdown-utils.ts` (`renderMarkdownPreview`) if unused, specs.
- **Project.body:** entity getter L53 + create L123 + update L157-161, `project.dto.ts` (L46, L73), `project.mapper.ts` (L99, L182), `project.presenter.ts` (L56 type, L127 legacy emit — keep bodyCanonical L130), `project.repository.ts` (L108), console `project.form.ts:356` (`toBilingualRichTextPayload(raw.body)` — source rich from the editor control, not `body`), specs.
- **TechnicalHighlight.challenge/approach/outcome:** `project.mapper.ts` (L129-143 legacy CAO reads), `project-highlight.mapper.ts` (L27-29 legacy assign — keep canonical L44-65), `project.repository.ts` (L30-42 legacy writes), `project.presenter.ts` (L143-145 legacy emit — keep the *Canonical added this session), console `project.form.ts` (CAO legacy), specs.
- **Experience.description/responsibilities/highlights:** entity getters L43/47/51 + load L184-186 + update L232-234, `experience.dto.ts` (L43-50, L81-86), `experience.mapper.ts` (L24-40 toDomain, L76-90 toPersistence), `experience.presenter.ts` (L29-31 legacy emit — keep the *Canonical added this session), `experience.repository.ts` (L51-62), handlers `create/update-experience.handler.ts` (L81-93 — keep field-name calls), console `experience.form.ts` (L295-297 legacy derive), landing type + `toVm` legacy (from P2), specs.

**Specs to flip legacy-optional → rich-only:** `project.dto.spec.ts`, `blog-post-commands.spec.ts`, `blog-post.presenter.spec.ts` (L67,162), `blog-post-queries.spec.ts` (L126,238), `blog-post.entity.spec.ts` (content L13,18,57-64,144), `blog-post.mapper.spec.ts` (L95), `experience-commands.spec.ts` (L214-219), `experience.dto.spec.ts` (L120,128), `experience.entity.spec.ts` (L102,146), `experience.mapper.spec.ts` (add canonical asserts L75-83), `project.entity.spec.ts` (body L29,45,83), `project.presenter.spec.ts` (L89,103), `project.mapper.spec.ts` (L156,179,241-249 add canonical), profile specs, repository specs.

### ⏭ PHASE 4 — Contract migration (destructive; run LAST)
- Backup: `bash .claude/skills/prisma-migrate/scripts/backup.sh drop_legacy_prose`.
- Edit `apps/api/prisma/schema.prisma`, drop 9 legacy columns: `profiles.bioLong` (L366), `projects.body` (L620), `blog_posts.content` (L726, NOT NULL), `experiences.description`/`responsibilities`/`highlights` (L511-513), `technical_highlights.challenge`/`approach`/`outcome` (L665-667).
- **⚠ SEED must be updated first/together:** `apps/api/prisma/seeds/dev-content.seed.ts` currently writes legacy `bioLong`/experience string-arrays/etc. After the drop the seed breaks. Decide: rewrite seed to emit `*Json` (needs a doc builder), OR drop those fields from the seed (dev authors via console). Per "no backfill + author on console" this likely = seed stops writing prose, or writes minimal rich.
- Generate (user, needs TTY): `npx prisma migrate dev --create-only --name drop_legacy_prose_columns --config apps/api/prisma/prisma.config.ts`; review SQL = 9× `DROP COLUMN`; apply `npx prisma migrate dev …`; then `npx prisma generate …`.

### ⏭ PHASE 5 — Verify
`npx prisma generate` → `npx tsc --noEmit` / `nx build api` + `nx build landing` → API jest sweep + landing tests → Playwright `/about` (experience) + `/blog/:slug` (read-time) + `/projects/:slug` (body). The dropped-column prisma types will surface any missed legacy read as a type error (a useful finishing grep).

## Technical Notes
- Use the `prisma-migrate` skill (destructive-change check + backup).
- Gate on real cutover, not calendar — only drop once Phases 5–8 ship and reads are verified off the legacy columns.

## Files to Touch
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_drop_legacy_prose_columns/migration.sql`
- any repo/DTO still typing the old fields

## Dependencies
- 305 (expand), 311 (console writes new fields), 312/313/314 (landing reads new fields), 317/318/319 (parsers retired + backfill)

## Complexity: M

## Live legacy-read audit (2026-06-30, during task 318)

Grepped every runtime read of a legacy prose column (BE presenter/repo + landing renderers). **Drop-readiness per field group** — a group can only be dropped once it shows ✅:

| Field group | Legacy col | Still-live runtime read | Verdict |
|---|---|---|---|
| **Project body** | `Project.body` | landing renders `bodyHtml` (`project.detail.ts:120`); no legacy read | ✅ ready (313 done) |
| **Project highlights** | `TechnicalHighlight.challenge/approach/outcome` | landing reads rich html via project detail; verify no legacy fallback in highlight mapper | ✅ likely ready — confirm `project-highlight.mapper.ts` has no read-time legacy path |
| **Blog content** | `BlogPost.content` | ⚠️ landing `blog.detail.ts:141` `wordCount(p.content)` reads legacy markdown for read-time; presenter still ships `content` (`blog-post.presenter.ts:40,109`; public detail DTO exposes it) | ❌ **blocked** — switch landing to API `readTimeMinutes` (or derive from `contentHtml`), drop `content` from public presenter/DTO first |
| **Profile bioLong** | `Profile.bioLong` | ⚠️ landing home intro renders legacy markdown via `parseBioLong` (`home.intro.ts:33`, `home.intro.util.ts`) because **task 312 is blocked** (per-paragraph lamp/pen ≠ single innerHTML) | ❌ **blocked on 312** (prose-block-renderer epic) |
| **Experience desc/resp/highlights** | `Experience.description/responsibilities/highlights` | ⚠️ landing about renders legacy JSON arrays (`about.experience.util.ts:18-19`, `.html:180-198`) as bullet lists | 🔶 **gated — render-swap folded inline (2026-07-01):** DECIDED rich w/ constrained schema (lists + marks, no blocks); drop-legacy direction kept. Swap to `<rte-render [doc]>` off `*Json` + constrained console preset done in this task (see "Experience render-swap (folded)"). No separate task. |

**Consequence:** the drop stays a single big-bang, but gated behind the "Cutover reads" phase above — it fires only once Profile (312), Blog (inline cutover), and Experience (inline render-swap) all land. Blog + Experience cutovers are folded into this task; Profile rides task 312.

**Open gap — RESOLVED 2026-07-01:** the missing Experience RTE render-swap is no longer a gap. Decision: rich-text with a constrained schema (lists + simple marks, no block elements), drop-legacy direction kept, render-swap folded inline into this task. No separate task created.

**Task 318 note:** the importer writes the full triplet (`contentJson/Html/SchemaVersion`) AND keeps raw markdown in legacy `content` — required because read-time still derives from it (entity `calculateReadTime` + landing `wordCount`). 318 adds no new legacy debt; it makes import match create/update.

## Progress Log
- [2026-07-03] **Live-server verification + fixed 2 pre-existing broken e2e specs (found during verify).**
  - **Live e2e (server on :3000, DB with columns dropped):** blog-post **29/29**, experience **21/21**, project **27/27**, profile **20/20**. (The earlier mass failures were purely the auth rate-limiter tripping on back-to-back per-suite logins + a stale profile spec — not schema issues.)
  - **Runtime spot-checks:** `GET /api/experiences` → Redoc carries `highlightsHtml`+`highlightsCanonical`, no legacy `highlights` key, no 500. Landing `/about` (Playwright): Redoc highlights + day-to-day render via `<rte-render>` (2 hosts, 16 `<li>/<p>`), **0 console errors, 0 NG0001**. Profile `bioLongJson`→triple confirmed via the identity PATCH e2e.
  - **Fixed 2 PRE-EXISTING broken specs (unrelated to 363, surfaced during verify):**
    - `api-e2e/project` "reject invalid sourceUrl" → the schema uses `links[]` (each with a validated `url`), not a `sourceUrl` field; rewrote it to post a bad-URL `links` entry. 26/27 → **27/27**.
    - `api-e2e/profile` — the whole suite drove a removed `PUT /api/admin/profile` upsert route; the API is now slice-based granular PATCH (`identity`/`contact`/`location`/`social-links`/`avatar`…) with **no create endpoint**. Rewrote: seed a bare profile row via Prisma in `beforeAll` (mirrors `prisma/seed.ts`), then exercise each PATCH slice + admin GET + public field-filtering + JSON-LD + auth. Dropped the old "404 when no admin profile" case (it deleted ALL admin profiles = destroys real dev data, and there's no API path to restore). 15-fail → **20/20**.
  - **⏭ REMAINING (rủi ro thấp):** console **experience.detail** page visual (new `<rte-render-html>`) — build-verified via AOT + type-check + identical pattern already live in blog/project console detail; not runtime-checked because console login is Google OAuth (hard to automate headless).
- [2026-07-03] **Migration APPLIED + all remaining code/spec cleanup done. Repo fully green against dropped columns.**
  - **Migration:** user applied `drop_legacy_prose_columns` (9 legacy columns gone from DB; the 8 data-loss warnings were the expected throwaway plain columns — authored content lives in the kept `*Canonical` cols).
  - **Console experience.detail** (was the runtime-crash item): `experience.types.ts` — dropped plain `description`/`responsibilities`/`highlights` + `TranslatableStringArray`, added `descriptionHtml`/`responsibilitiesHtml`/`highlightsHtml: TranslatableJson | null`, removed the legacy plain fields from Create/Update payloads. `experience.detail.html` — 3 sections now render `<rte-render-html [html]="…Html.en|vi">` (mirrors blog/project console detail). `experience.detail.ts` imports `RteRenderHtml`.
  - **Spec sweep (all green):** blog **entity** (removed `content`; `create` leaves readTime null + added `withContentRichText()` coverage; publish/update guards keyed on `contentJson`), blog **commands** (create sends `contentJson`; mocks now return `canonical`; mocked `rte-core` `plainTextFromDoc` to dodge ESM `isomorphic-dompurify` in node-env; publish-transition fixture carries a body), blog **dto** (`contentJson` required fixture; renamed "missing content"→"missing contentJson"), blog **presenter** + **queries** (assert `contentHtml` triple instead of `content`), blog **mapper** (dropped `content` from RAW fixture), **profile** mapper (dropped `bioLong`), **project** mapper (dropped `body` + highlight CAO plain). rte-canonical-contract 22/22 (bioLong etc. are RTE field prefixes — kept).
  - **scripts/** `seed-prose-demo.ts` — removed the `content: plain` write to the dropped column (kept the rich triple + read-time). `backfill-canonical.ts`/`migrate-rich-text.ts` — no dropped-column writes (checked).
  - **e2e** — `api-e2e/blog-post` (payload `content`→`contentJson` editor doc; "missing content"→"missing contentJson"; detail asserts `contentHtml`), `api-e2e/profile` (`bioLong`→`bioLongJson` bilingual doc), `api-e2e/project` (highlight `challenge/approach/outcome`→`*Json` via `hlDoc` helper), `console-e2e/helpers/db-profile` + `landing-e2e/profile` (dropped `bioLong` from seed), `landing-e2e/about` (experience `highlights` string-arrays → `highlightsJson` editor docs via `hlDoc`, text preserved so the panel-text assertion still holds).
  - **Verified now:** jest 4 modules **408/408** + rte-canonical-contract **22/22** ✅ · `tsc -p apps/api/tsconfig.app.json` EXIT 0 ✅ · `nx build console` ✅ (AOT validated the new experience.detail template; only pre-existing bundle-budget warning) · earlier `nx build landing` + `nx build api` ✅.
  - **⏭ REMAINING (only runtime/visual, need live servers — user):**
    1. Run e2e suites (`api-e2e`, `console-e2e`, `landing-e2e`) — they need the API/DB + landing/console servers up.
    2. Playwright visual verify: `/about` experience (EN+VI), `/blog/:slug` read-time, `/projects/:slug` body+highlights, and the console experience **detail** page (new `<rte-render-html>`).
- [2026-07-02] **PHASE 3 + 4 (schema) done; STOPPED at a clean build point (user request). Migration + specs + console-experience-detail remain.**
  - **Phase 3 legacy removal (all 5 groups):** Profile.bioLong, Experience.description/responsibilities/highlights, Project.body, TechnicalHighlight.challenge/approach/outcome, BlogPost.content — removed from entities/VOs/DTOs/mappers/repos/presenters/console-types/console-forms/landing-types. Blog done by hand (reordered create handler so `publish()` body-guard runs after the rich body; guards now check `contentJson`; create requires `contentJson`; `calculateReadTime` kept, fed from canonical). Profile/Experience/Project+TH done by 3 parallel agents. Console **blog** + **project** detail read-views migrated to `<rte-render-html>` off `*Html`; deleted unused `markdown-utils.ts`.
  - **Phase 4 schema:** dropped the 9 legacy columns from `schema.prisma`; `prisma generate` run (client regenerated). **DB migration NOT yet applied** (user step).
  - **Seed:** `dev-content.seed.ts` no longer writes legacy prose (bioLong / experience d/r/h / project highlight CAO) — per user decision "phase out seed content, author via console." Entities still created skeletally. Removed unused `BIO_LONG_EN` + `tArr`.
  - **Verified now:** `nx build landing` ✅ (fixed the `ddl-blog-detail.ts` `post.content` error the user hit), `nx build api` ✅, `tsc -p apps/api/tsconfig.app.json` EXIT 0 (app source fully clean against the dropped-column client — Phase 3 BE completeness confirmed by compiler). Removed the project-repo `legacyEmpty` CAO placeholder writes (would break Prisma at runtime).
  - **⏭ REMAINING (resume here):**
    1. **USER: apply the migration (TTY):** `npx prisma migrate dev --name drop_legacy_prose_columns --config apps/api/prisma/prisma.config.ts`, then restart API + landing dev servers. (Backup skipped — `pg_dump` unavailable; only throwaway legacy columns dropped, authored rich content is in kept `*Canonical` columns.)
    2. **Console experience.detail** — `libs/console/feature-experience/src/lib/experience.detail/experience.detail.html` + `experience.types.ts` (`AdminExperience`) still render/declare legacy `description`/`responsibilities`/`highlights` → **runtime crash** (API no longer returns them). Migrate to `<rte-render-html>` off `*Html` (mirror the blog/project console detail migration) + drop legacy from `AdminExperience`.
    3. **Specs** — mapper specs (`profile`/`blog`/`project`/`experience` `RAW_*` fixtures) still carry dropped Prisma columns → jest tsc errors; blog specs still create posts with legacy `content`. Sweep + run `npx jest --config apps/api/jest.config.cts <file> --no-coverage` per module. (Agents updated most domain/dto/presenter specs; the Prisma-typed RAW fixtures were intentionally left until the column drop — now do them.)
    4. **scripts/** — `seed-prose-demo.ts` references dropped `content` (obsolete demo seeder — delete or fix); re-check `backfill-canonical.ts` / `migrate-rich-text.ts`.
    5. **e2e** — `api-e2e`/`landing-e2e`/`console-e2e` still send/expect legacy fields (bioLong etc.) → update after migrate.
    6. **Final verify:** `nx build console` + full jest sweep + Playwright `/about` (experience), `/blog/:slug` (read-time), `/projects/:slug` (body/highlights).
- [2026-07-02] **BUG FOUND + FIXED (task-385 write-axis gap) + PHASE 2 render verified end-to-end.**
  - **Bug:** `experience.repository.ts` `update()` hand-picks columns and wrote `*Json`/`*Html`/`*SchemaVersion` for description/responsibilities/highlights but **omitted all three `*Canonical` columns** — so every experience EDIT silently dropped canonical (the 363 read source). `add()` was fine (uses `toPrisma`). This is why experience was 0/3 canonical. **Fixed:** added `descriptionCanonical`/`responsibilitiesCanonical`/`highlightsCanonical` to the update data block. Audited the other 4 groups' write paths — all OK (profile `bioLongCanonical`, project `bodyCanonical`, technicalHighlight CAO canonical in the upsert helper, blog `contentCanonical`); experience `update` was the only gap.
  - **End-to-end verify (redoc, authored via admin PUT — dev throwaway):** DB now has `highlightsCanonical`/`responsibilitiesCanonical` (bulletList, 3/5 items); `/api/experiences` emits them; landing `/about` renders `<rte-render class="exp-detail__highlights rte-content">` → `<ul>` 3× `<li>` (EN + VI), responsibilities 5× `<li>`, "Day-to-day" localizes ("CÔNG VIỆC HÀNG NGÀY"). VI shows authored VI canonical text. Playwright-confirmed both locales read canonical, not legacy.
  - **⚠ Stale-HMR overlay:** the running landing dev server shows a transient NG0001 "rte-render is not a known element" overlay (from the intermediate compile where the template used `<rte-render>` before the component imported it). Source is correct (`RteRender` imported + in `imports`) and `nx build landing` (AOT) passes — AOT rejects unknown elements, so this is purely a stale-HMR artifact. **User: restart landing dev server to clear it** (per landing-hmr-stale-restart rule; Claude must not restart it).
- [2026-07-02] **PHASE 2 complete (read cutover — non-destructive, both builds green).**
  - **Blog read-time (BE):** `blog-post.entity.ts` — `create` sets `readTimeMinutes: null`; `update` carries existing (no more recompute from legacy `content`); `withContentRichText(rich, readTimeMinutes, userId)` now takes the computed read-time. Handlers `create-post.command.ts` + `update-post.command.ts` compute `BlogPost.calculateReadTime(plainTextFromDoc(rich.canonical[lang]))` after canonicalize and pass it in. `calculateReadTime` (/200 formula) kept; only its input source moved to canonical.
  - **Blog read-time (landing):** `blog.detail.ts` `postType` — `wordCount(p.content)` → `(p.readTimeMinutes ?? 0) >= 8` (1500 words ≈ 8 min). Removed `wordCount` from `blog.detail.util.ts` + its import. Template already showed `readTimeMinutes` directly. DDL demo (`ddl-blog-detail`) untouched — self-contained own util + demo data.
  - **Experience render-swap (landing → canonical):** `experience.types.ts` (data-access) +`descriptionCanonical`/`responsibilitiesCanonical`/`highlightsCanonical`. VM `about.experience.types.ts` — `highlights`/`responsibilities: string[]` → `highlightsDoc`/`responsibilitiesDoc: PortableDocument | null`. `about.experience.util.ts` `toVm` builds docs via new `canonicalDoc()` helper (mirrors home `bioDoc` empty-guard). Template swaps the two `<ul><li>` loops for `<rte-render contentClass="exp-detail__highlights|responsibilities" [doc]>`; kept the `<details>` disclosure. Component imports `RteRender`. SCSS retargets list/▹-bullet styling at the `<rte-render>` host's descendant `ul`/`li`/`p`.
  - **Console constrained preset:** NO CHANGE NEEDED — `responsibilities`/`highlights` already `mode="list"` (bullet/ordered list + inline marks, no headings/quote/code/media). `description` stays `mode="semantic"` (**user decision 2026-07-02**: description isn't rendered on the landing card; the two rendered fields are already constrained; not worth a new rte-core EditorMode).
  - **Verify:** `nx build api` ✅ + `nx build landing` ✅ (only pre-existing bundle-budget warnings). **Visual Playwright verify still pending** — experience rich cols are 0/3 locally; author a sample experience via admin PATCH first (like bioLong), then check `/about` EN+VI. Not blocking Phase 3 (build is type-safe).
- [2026-07-02] **PAUSED by user** ("dừng lại, ghi mọi thứ cần làm vào task, làm sau"). Shipped Phase 1 only (kept — additive, non-destructive): presenter `*Canonical` for experience + technicalHighlight, the presenter-canonical enforcement spec (22 green), and `plainTextFromDoc` in rte-core. Full remaining plan (Phases 2–5, with file:line) captured in the new **"Remaining Work (resume plan)"** section above — resume there. Nothing destructive was done; no columns dropped; repo builds.
- [2026-07-02] **Unblocked + started (all deps done: 305/311/312/313/314/317/318/319).** Decisions locked with user:
  - **Profile gate ✅ cutover** — task 312 landed (home-intro reads `bioLongCanonical`, `parseBioLong` deleted).
  - **Two axes clarified:** task 385 delivered the *write* axis (canonical column + compute + persist for all 9 fields). 363 is the *read* axis + legacy removal — 385's "all green" does NOT imply 363 done. Verified live DB (dev): rich cols empty for experience (0/3) + technicalHighlight (0/20); blog 4/17; project body all-null (8/8 empty legacy+rich); profile 1/1 (PATCHed).
  - **No backfill** (user): dev post/exp data is throwaway; prod authored fresh via console. Drop runs against dev directly. To verify experience render locally, author a sample via admin PATCH (like bioLong), not a backfill script.
  - **Experience read source = `*Canonical` + `<rte-render [doc]>`** (not `*Json`, not `*Html`).
  - **NEW contract (user): every public presenter of an RTE field MUST emit `<field>Canonical`.** Extends ADR-023 from DB-column to read-surface. Add missing `experience.*Canonical` (+ technicalHighlight if missing) to presenters, and enforce with a spec.
  - **Read-time:** keep `Math.ceil(words / 200)` (200 WPM) but source plain text from canonical via a new shared `plainTextFromDoc` (rte-core) instead of legacy markdown `content`.
- [2026-07-01] **Experience decision locked + folded.** Owner: Experience desc/resp/highlights = **rich-text with a constrained schema** (lists + simple inline marks, no block elements). Render-swap folded **inline** into this task (not a separate task) — consistent with how Blog cutover already lives here. Recorded phased execution (cutover reads → dual-field cleanup → single contract migration → verify) so the destructive drop stays atomic and last. Updated "Blocked On" item 3, audit-table Experience verdict (🔶 gated), and closed the "Open gap" (missing experience render-swap task) as RESOLVED. Also noted 312 is now hardware-unblocked (prose-block-renderer shipped `<rte-render [doc]>`).
- [2026-06-30] Status → **blocked**. Re-verified all 5 groups against current code (post-318): audit holds exactly. Profile reads legacy via `parseBioLong` (312 still blocked); blog `wordCount(p.content)` + presenter `content:40,109` still live; experience renders legacy string arrays, no render-swap task. Project render-safe but BE still plumbs legacy fields. Recorded prerequisites in "Blocked On". User decision (2026-06-30): hold 363, unblock prerequisites first, then drop all five at once.
- [2026-06-30] Recorded live legacy-read audit (above) during task 318. Blog content is the only group near-droppable; profile/experience blocked; flagged the missing experience render-swap task.
- [2026-06-28] Clear-field check (pre-commit review flag): NOT a regression. `toBilingualRichTextPayload` / `buildBioLongJson` gate on `null` (`??`), not emptiness — a cleared editor emits a present-but-empty doc, so it is sent and the BE wipes the field. Only a never-touched field with no doc is omitted (nothing to clear). Locked by `rich-text.validator.spec.ts` ("sends a present-but-empty doc so a cleared field can be wiped"). No action needed here.
- [2026-06-28] Added "311 dual-field cleanup" checklist — task 311 is now COMPLETE (S1 Profile.bioLong, S2 Project body/highlights, S3 Blog content, S4 Experience description/responsibilities/highlights) and all five groups dual-write legacy + `*Json`. This task gates removal of the legacy side after the landing render swaps (312–314, + an experience render swap) land. Blog adds a wrinkle: legacy `content` is NOT NULL and the FE derives plain text to fill it — that derivation and the column go together here.
