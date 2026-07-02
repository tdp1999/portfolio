# Architecture Decision Records

## 2026-01-30: Initial Architecture Decisions

### ADR-001: Monorepo Structure

**Status:** Accepted
**Context:** Need to share code between landing page and dashboard
**Decision:** Use pnpm workspaces with Nx for build orchestration
**Consequences:** Shared types, UI components, and utilities across apps

### ADR-002: Angular for Frontend

**Status:** Accepted
**Context:** Framework choice for both landing and dashboard
**Decision:** Angular 19+ with SSR for landing, SPA for dashboard
**Consequences:** Familiar patterns, strong typing, good enterprise tooling

### ADR-003: NestJS for Backend

**Status:** Accepted
**Context:** API framework selection
**Decision:** NestJS with layered architecture (Controllers → Services → Repositories)
**Consequences:** Angular-like patterns, great TypeScript support, Prisma integration

### ADR-004: Stage 1 Mock Data Strategy

**Status:** Accepted
**Context:** Need to develop without database initially
**Decision:** JSON files in /data/mock with API abstraction layer
**Consequences:** Easy swap to real database later, can develop full flow immediately

### ADR-005: Tailwind CSS for Styling

**Status:** Superseded by ADR-007
**Context:** Styling approach for consistent design
**Decision:** Tailwind CSS 4.x with custom theme for dark/light modes
**Consequences:** Utility-first approach, easy theming, consistent across apps
**Note:** Decision superseded - project uses SCSS instead (see ADR-007)

### ADR-006: Test-Driven Development (TDD) Approach

**Status:** Accepted
**Date:** 2026-02-01

**Context:** Need to ensure code quality, prevent regressions, and maintain development confidence as the project grows. Given the portfolio nature and the need for reliability, adopting a testing strategy early is critical.

**Decision:** Adopt pragmatic Test-Driven Development (TDD) approach with the following:

- **Testing Stack:**
  - Jest for unit and integration testing (already configured)
  - Playwright for end-to-end testing
  - Supertest for API endpoint testing (optional)
- **Coverage Targets:**
  - API endpoints: 90%+ coverage (critical path)
  - Business logic (services): 80-90% coverage
  - Complex components: 70-80% coverage
  - Simple UI components: Optional (focus on integration/E2E)
- **TDD Workflow:** Red-Green-Refactor cycle
  1. Write failing test first
  2. Implement minimal code to pass
  3. Refactor while keeping tests green
  4. Commit with tests included

**Rationale:**

- Pragmatic approach balances quality with development velocity
- Focus on critical paths (API, business logic) ensures reliability where it matters most
- Jest already configured in workspace, low barrier to entry
- Playwright provides robust E2E testing for user flows
- TDD workflow catches bugs early and serves as living documentation

**Alternatives Considered:**

- **No testing:** Rejected - too risky for production portfolio site
- **Strict TDD (90%+ all code):** Rejected - too time-consuming for simple UI components
- **Testing after implementation:** Rejected - often skipped under time pressure

**Consequences:**

- All new features must include tests written before implementation
- Increased initial development time per feature (~20-30%)
- Higher confidence in deployments and refactoring
- Tests serve as documentation for expected behavior
- Need to set up Playwright for E2E testing
- CI/CD pipeline must run all tests before deployment

**Impact on Existing Work:**

- Existing generated code (landing app, API app) will have tests added retroactively for critical paths
- Future tasks should allocate time for writing tests first

---

### ADR-007: Standardize Styling to SCSS

**Status:** Accepted
**Date:** 2026-02-02

**Context:** The Angular landing app was generated with SCSS support (`inlineStyleLanguage: "scss"`) and uses `.scss` files for global and component styles. However, some generated library files (in `libs/ui/`, `libs/api-client/`) still use `.css` extensions, creating inconsistency in the styling approach across the project.

**Decision:** Standardize all styling to use SCSS exclusively across the entire project:

- All component styles use `.scss` extension
- All global styles use `.scss` extension
- All library projects configured with `inlineStyleLanguage: "scss"`
- Convert existing `.css` stub files to `.scss`
- SCSS features (variables, nesting, mixins) available but not required initially
- BEM naming convention for CSS classes (`.component-name__element--modifier`)

**Rationale:**

- **Consistency:** Uniform styling approach across all apps and libraries
- **Future-ready:** Enables SCSS features (variables, mixins, nesting) when needed for theming or design system
- **Angular best practice:** SCSS is the Angular community standard and default in modern Angular CLI
- **Zero migration cost:** Angular landing app already uses SCSS, only library stubs need conversion
- **Gradual adoption:** Can start with plain CSS syntax in `.scss` files, adopt SCSS features incrementally

**Alternatives Considered:**

- **Plain CSS everywhere:** Rejected - loses Angular tooling benefits and SCSS features for future theming
- **CSS Modules:** Rejected - not standard in Angular ecosystem
- **Tailwind CSS:** Initial plan (ADR-005) but project already generated with SCSS, no Tailwind installed
- **Styled Components/CSS-in-JS:** Rejected - not idiomatic in Angular, adds complexity

**Consequences:**

- Convert stub `.css` files to `.scss` in libraries:
  - `libs/ui/src/lib/ui/ui.css` → `ui.scss`
  - `libs/api-client/src/lib/api-client/api-client.css` → `api-client.scss`
- Library project configurations should specify `inlineStyleLanguage: "scss"` if they have components
- Future components automatically generated with `.scss` extension
- Design system can leverage SCSS variables for theming when implemented
- No impact on bundle size - SCSS compiles to standard CSS

**Impact on Existing Work:**

- Minimal impact - only affects empty stub files in libraries
- Future styling patterns documented in `.context/design/`

---

### ADR-008: Downgrade Tailwind CSS v4 to v3

**Status:** Accepted
**Date:** 2026-02-08

**Context:** Tailwind CSS v4 was installed as part of the Design System epic (task 020). However, v4 has known compatibility issues with Angular v21 (ref: angular/angular-cli#29789). The v4 CSS-first architecture (`@import "tailwindcss"`, `@theme {}` directive, `theme()` function) conflicts with Angular's build pipeline, causing build failures and runtime issues.

**Decision:** Downgrade from Tailwind CSS v4 to v3 and adopt the hybrid SCSS + Tailwind approach:

- **Tailwind v3** with `tailwind.config.js` for utility class generation
- **PostCSS** with `tailwindcss` + `autoprefixer` plugins (replacing v4's `@tailwindcss/postcss`)
- **SCSS** files with `@tailwind` directives instead of v4's `@import "tailwindcss"`
- **CSS custom properties** in `:root` instead of v4's `@theme {}` block
- **Hex values** for gray scale references instead of v4's `theme(colors.gray.X)` function
- **`darkMode: 'class'`** in `tailwind.config.js` for dark mode support

**Rationale:**

- Tailwind v4 has documented incompatibilities with Angular v21's build system
- v3 is stable, well-documented, and has broad Angular ecosystem support
- The migration preserves all design token functionality using CSS custom properties
- Same Tailwind utility classes work in both v3 and v4 (no template changes needed)

**Alternatives Considered:**

- **Wait for v4 Angular fix:** Rejected - unclear timeline, blocks design system progress
- **Use v4 with workarounds:** Rejected - fragile, would require constant maintenance
- **Drop Tailwind entirely:** Rejected - utility-first approach provides significant productivity benefits

**Consequences:**

- Tasks 020-024 rewritten to target v3 setup
- Color tokens moved from `@theme {}` to `tailwind.config.js` `theme.extend.colors` + `:root` CSS vars
- `theme(colors.gray.X)` references replaced with hex values
- `.postcssrc.json` replaced with `postcss.config.js`
- `tailwind.config.js` created at workspace root
- Epic and documentation updated to reference v3 approach
- Future upgrade to v4 possible when Angular compatibility is resolved

## 2026-03-17: Response Shaping Pattern

### ADR-012: Presenter Pattern for Domain-to-DTO Mapping

**Status:** Accepted
**Context:** Query handlers had inline object mapping from domain entities to response DTOs, duplicated across handlers. Considered alternatives: entity.toResponse() method, infrastructure mapper, controller mapping, or dedicated presenter.
**Decision:** Use a **Presenter class** in the Application layer (`{module}.presenter.ts`) with static `toResponse()` methods. Domain entities must NOT contain toDTO/toResponse methods (anti-pattern per Vernon, Uncle Bob, Cockburn). Query handlers call `Presenter.toResponse()` instead of inline mapping.
**Consequences:** Single source of truth for response shape per module. Domain entities stay pure. Easy to add multiple shapes (toSummary, toDetail) when needed. Applied retroactively to Tag module, enforced for all future modules.

## 2026-04-13: Long-Form Layout & Save Semantics

### ADR-013: Long-Form Layout Chassis — Sectioned Cards + Sticky Scrollspy Rail

**Status:** Accepted
**Context:** Console pages with many fields (Profile ~30 fields, Experience ~25, Project ~14 + relations) currently render as flat single-column forms with all space biased to the left half of the viewport. Researched 5 patterns (wizard, progressive single-page + scrollspy, tabs, accordion, one-thing-per-page) against project needs. Cross-page nav (Profile / Account / Notifications / Billing) and in-page nav both needed. See `.context/design/bank/patterns/long-form-layout.md` for full pattern catalog and decision matrix.
**Decision:** Adopt a **single universal chassis** for all long-form pages in console: vertically stacked **section cards** (description-left / form-right per `bank/patterns/settings-section.md`) plus a **sticky scrollspy left rail** as the only in-page nav. Cross-page navigation uses **routes**, not tabs. No 3-column layouts; the console sidebar may collapse on detail pages.
**Consequences:**
- Universal layout — users learn once, applies to Profile, Experience, Project, future entities
- Scrollspy rail uses Angular CDK `ScrollDispatcher` + `IntersectionObserver` (no third-party lib)
- Section status indicators (✓/●/⚠/○) live on the rail and are populated regardless of save mechanic (see ADR-014)
- Rejected: top tabs (duplicates routing), accordions (too click-heavy), 3-column layouts (visually crowded)
- Section-card structure may require restructuring monolithic FormGroups into child FormGroups for status mapping

### ADR-014: Save Semantics — Per-Section for Settings, Atomic for Domain Entities

**Status:** Accepted
**Context:** ADR-013 establishes a shared layout chassis but doesn't prescribe save mechanics. Two valid mechanics exist: per-section save (Stripe/Linear settings) and atomic save (GitHub repo settings, Stripe Connect onboarding). Choosing one for all modules forces a wrong fit somewhere. Current BE state: Profile / Experience / Project all expose single coarse-grained `Update*Command` with monolithic Zod schema; FE uses single FormGroup. Profile already has fine-grained breadcrumbs (`UpdateAvatarCommand`, `UpdateOgImageCommand`).
**Decision:** Choose save mechanic by **module type**, not by layout:

| Module type | Save mechanic | BE shape | Examples |
|---|---|---|---|
| **Settings / Preferences** (loose collection of independent fields) | Per-section save with section-level Save button | Section commands + section value objects + section Zod schemas | Profile, Notifications, Billing |
| **Domain entity** (transactional, cross-field invariants) | Atomic save with sticky save bar | Single command, monolithic aggregate, full schema validation | Experience, Project, Article, Skill |

Atomic save requires the full UX combo from `bank/patterns/atomic-save.md`: sticky save bar, scrollspy section status, submit-time validation summary, `CanDeactivate` + `beforeunload` nav guard, optional localStorage draft.
**Consequences:**
- Profile requires structural refactor: aggregate split into VOs (Identity, WorkAvailability, ContactInfo, Social, SEO), section commands, section schemas, FE child FormGroups (tracked as separate epic)
- Experience / Project keep current atomic command shape; need only FE additions: sticky save bar, nav guard, scrollspy status mapping
- New modules: classify on creation as Settings vs Domain entity; pick mechanic accordingly
- Section names live in domain (VO names for Settings; logical groupings for Domain entities) — keeps BE and FE labels in sync

### ADR-015: Experience Content Model — Responsibilities, Highlights, Links, Drop ClientIndustry

**Status:** Accepted
**Context:** Reviewing the Experience form surfaced two domain-modeling problems and one extensibility question: (1) "Achievements" was rarely filled — the user's CV uses "Key Responsibilities" almost exclusively; (2) `clientIndustry` and `domain` were two free-text fields with no clear distinction, while the CV uses a single "Work Domain"; (3) the user plans future downstream consumers (CV/resume generator, AI feeds, third-party services) that need predictable, structured fields, ruling out flexible escape hatches like markdown notes, key-value properties, or schemaless JSON blobs (label drift makes them unparseable for downstream consumers).
**Decision:**
1. **Rename** `achievements` → `responsibilities` (translatable JSON, same `{ en: string[], vi: string[] }` shape). UI section "Achievements" becomes "Responsibilities".
2. **Drop** `clientIndustry`. Keep `domain` as the single work-domain field.
3. **Add** `highlights: { en: string[], vi: string[] }` (translatable JSON array) — quantified-impact bullets distinct from responsibilities (outcomes, not activities). High value for CV generators.
4. **Add** `links: { label: string, url: string }[]` (non-translatable JSON array) — case studies, repos, demos, press. Labels in English only for v1.
5. **No flexible escape hatch** (no markdown notes, key-value properties, or JSON extras). Future fields are added with explicit migrations as concrete needs emerge.
**Consequences:**
- One Prisma migration touches Experience table (rename column, drop column, add two columns). No production data — migration can be destructive.
- BE entity, mapper, repository, DTO, presenter, command/query handlers + specs all updated.
- FE console form gains `highlights` FormArray (mirrors responsibilities) and `links` FormArray ({ label, url } group). Form section count grows.
- FE landing renders highlights and links if present; responsibilities replaces achievements in render.
- Discipline going forward: when CV generator (or other consumer) needs a new field, add a typed column with a migration — do not retrofit a generic blob.

### ADR-016: Console Validation Limits — Canonical Caps for BE/FE Inconsistencies

**Status:** Accepted
**Context:** The console validation audit (`.context/investigations/inv-console-validation-audit.md`, 2026-04-28) surfaced a class of inconsistencies inside the BE itself — same concept, different cap across modules. With the new `libs/shared/validation` lib supplying a single `LIMITS` table consumed by both FE Validators and BE Zod atoms, every concept needs exactly one canonical value.
**Decision:**
1. **`yoe.max = 99`** site-wide. Skill (`max(50)`) was tightened to align with Profile (`max(99)`). Capping at 50 would have rejected legitimate seniority ranges; 99 is the practical upper bound.
2. **`displayOrder.min = 0`** on every entity (Category, Skill, Experience, Project, Tag). Negative orders have no business meaning; a missing `min(0)` was an oversight, not a feature.
3. **`metaTitle.max = 70`** site-wide (was Blog `200` / Profile `70`). 70 is the SEO-correct cap for SERP rendering — Blog was lax, not Profile.
4. **`metaDescription.max = 160`** site-wide (was Blog `300` / Profile `160`). Same rationale — 160 matches search-result snippet truncation.
5. **`Tag.name.max = 50`** (FE was `100`, BE was `50`). BE was canonical; tags are short labels, not titles.
6. **Profile location strings**: required ones (`locationCountry`, `locationCity`) get `.min(1)`; optional ones (`locationPostalCode`, `locationAddress1`, `locationAddress2`) stay length-only.
**Consequences:**
- BE schema migrations are non-breaking widenings or tightenings on string lengths; no Prisma migration needed (values stored are already within the new caps).
- FE forms apply baselines from `baselineFor` so future drift is impossible — FE and BE both read from `LIMITS`.
- Future contributors changing a cap update `LIMITS` in one place; both runtimes follow.



### ADR-017: Unlock E4-C Lock for §3 Bio Card Grid (Task 284)

**Status:** Accepted (2026-05-05)
**Context:** E4 §C locked card visual register at "1px hairline · 4px radius · no shadow · considered motion · real screenshots only · no code/terminal decoration." Prototyping §3 Bio Card Grid against these constraints yielded austere options (PROTO-1..10) that author judged too passive for the only "live signal" surface on the home page. Reference comparison: parthh.in bio grid uses spotlight gradients, soft 16-24px radius, breaking-boundary overflow elements — at a polish level the constraint blocks. Author asked for higher-fidelity options.
**Decision:**
1. **§3 Bio Card Grid is now a sanctioned exception to E4-C.** Cards in this section may use: rounded corners > 4px, inner gradient/spotlight, gradient hairlines, ambient mesh backgrounds, breaking-boundary overflow elements, embedded artifact previews, hover transforms.
2. **E4-C remains the default** for all other landing sections (Selected Work, Stack, Story, Get in Touch, Footer Banner). §3 is the *one* section where richer surface treatment is permitted, justified by it being the identity/availability/contact glance-zone where craft visibly matters.
3. **Palette discipline preserved.** No new colors introduced — indigo accent + ink-0/1/2 + landing-text-300..600 only. No rainbow/saturated gradients. Aurora/glow uses existing accent at low opacity.
4. **Motion still considered.** Any animation must be subtle, optional, and respect `prefers-reduced-motion`.
**Consequences:**
- Task 284 prototype gallery extends with 7 PF-* options (spotlight bento, aurora mesh, editorial magazine, showcase artifact, breaking-boundary, brutalist mono, dimensional layers).
- Once §3 register is picked, may seed shared primitives (e.g. spotlight-card variant) — promote only if the pattern recurs.
- E4 epic file gets a footnote referencing this ADR; the lock text itself stays as default policy.

### ADR-018: Blog Page DDL Winners — List V1+V3 Hybrid · Detail V4 · Featured = Bento Strip

**Status:** Accepted (2026-05-25)
**Context:** Per `epic-portfolio-blog.md` (task 351), `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` staged variants for side-by-side review. Featured-treatment α (filter chip) vs β (tab) — both framed before the 2026-05-24 afternoon pivot that reshaped `/blog` into hero → featured-strip (bento) → archive list. After the pivot, featured posts live in the strip itself, not behind an archive filter.
**Decision:**
1. **List winner — V1 + V3 hybrid (count-switched featured strip).**
   - `3-4 featured` → V3 mosaic (top hero card spans full width + 2-3 archive cards underneath; archive grid widens to full container at counts ≤ 2).
   - `5+ featured` → V1 asymmetric (1 lead card ~60% + 4 side cards stacked ~40%).
   - V2 (left-anchored editorial) and V4 (horizontal scroll) **not** chosen — both retained on the DDL.
   - Featured-strip vertical budget fixed at ~800-900px (hero + strip together within one desktop viewport).
2. **Detail winner — V4 (center hero + far-right floating TOC).**
   - Hero: V1's centered treatment (eyebrow chips → title → dek → meta strip → compact icon-only share row → `landing-figure` cover).
   - TOC: V3's `landing-toc-sidebar` + scrollspy, anchored `position: fixed` to the far right of the viewport (outside the article container, distinct from `/projects` which keeps TOC inside the grid). Hidden when post is type `Note` or has fewer than 3 H2/H3 sections.
   - Mobile (<1280px): floating TOC hides; inline top-of-prose TOC card appears in its place.
   - Footer: `landing-blog-share-row` reuse + related posts + JSON-LD `<details>` + personal signature block.
   - V1/V2/V3 retained on the DDL per `feedback_ddl_keep_after_graduate`.
3. **Featured treatment — Treatment γ (bento strip, no archive filter).**
   - Featured posts surface exclusively via the V1+V3 strip above the archive list — no `Featured only` filter chip and no `All / Featured` tab in the archive toolbar.
   - Treatments α and β (the pre-pivot framing) are **rejected** because the bento strip already does the surfacing job they were meant to solve.
   - URL param `?featured=1` is not wired in v1; the shape stays extensible (filter extension point left open per the pivot's "shape must be extensible" rule).
**Consequences:**
- Task 352 graduates the V1+V3 hybrid as `BlogListPage`. Archive toolbar carries category + search + sort + view-toggle (no featured chip, no featured tab).
- Task 353 graduates V4 as `BlogDetailPage` with the centered hero + floating-TOC + signature pattern. `landing-blog-share-row` and the floating-TOC override (`::ng-deep` reset of host sticky inside a fixed positioning context) lift verbatim from the DDL.
- DDL pages `/ddl/blog-list-variants` and `/ddl/blog-detail-variants` remain in `DDL_SUBROUTES` post-graduation with chosen/unchosen pills marking the winner.
- If a `Featured only` archive filter is needed later, add as a category-style chip + `?featured=1` param — the pivot's filter-shape extensibility rule already accommodates this without revisiting the bento strip.

### ADR-019: Landing RTE Read-Path — Browser-Only Sanitize + Single Project Body Field (Task 313)

**Status:** Accepted (2026-06-29)
**Context:** Task 313 made `/projects/:slug` the first *prerendered* landing route to render rich text via `<rte-render-html>`. Two things surfaced:
1. `<rte-render-html>`'s `SafeHtmlPipe` ran the shared `sanitizeRichText` (rte-core), which imports `isomorphic-dompurify`. That package executes `new JSDOM()` at module top-level; jsdom is CommonJS and references `__dirname`, which is undefined in Angular's ESM SSR/prerender bundle. Result: `Error in handleRoute for '/projects': __dirname is not defined` — both `nx build landing` (prerender) and the dev SSR server failed. Task 308 had claimed the renderer "SSR-safe" but it was never exercised in a prerendered route.
2. AC asked whether `Project.sections[*].body` is a separate rich-text concept. The current `Project` model has **no** `sections` field — body is a single long-form field.
**Decision:**
1. **Read-time sanitize is browser-only on landing.** The `*Html` cache is already write-sanitized by the BE (`RichTextService` → `sanitizeRichText`, same `RICH_TEXT_WHITELIST`). `SafeHtmlPipe` now: on **server/prerender** trusts the cache as-is (`bypassSecurityTrustHtml`, no DOMPurify); in the **browser** re-runs DOMPurify as defense-in-depth. DOMPurify is idempotent on already-clean HTML, so the browser pass matches the server output → no hydration mismatch for a correctly write-sanitized cache.
2. **Browser sanitize uses plain `dompurify`, not `isomorphic-dompurify`.** Plain dompurify no-ops gracefully without a `window` (never touches jsdom), so it is safe to *import* in the server bundle while only being *called* in the browser. New file `libs/shared/features/rte-renderer/src/lib/sanitize-browser.ts` (`sanitizeRichTextBrowser`) mirrors rte-core's anchor-hardening + `id`-on-headings-only hook and the whitelist.
3. **Constants imported via a constants-only entry.** `sanitize-browser.ts` imports `RICH_TEXT_WHITELIST`/`ID_ALLOWED_TAGS` from `@portfolio/shared/features/rte-core/constants` (new tsconfig path → `rte.constants.ts`), NOT the rte-core barrel — the barrel `export *`s `rte.sanitize`, which would drag `isomorphic-dompurify` back into the server bundle.
4. **`id` whitelisted on headings only.** `RICH_TEXT_WHITELIST.ALLOWED_ATTR` now includes `id`; the shared sanitize hook strips `id` from every element except `h2`/`h3`/`h4` (no anchor spoofing on `<a>`). Applies to both BE write and FE read gates.
5. **Project body = one rich-text field; no `sections`.** No `Project.sections` is introduced. The case-study body is the single `bodyJson`/`bodyHtml` field; ToC anchors come from a read-time slugger (`addHeadingAnchors`, `@portfolio/landing/shared/util`) over `bodyHtml`. Generic text helpers (`slugify`/`escAttr`/`decodeHtml`) also moved to that lib (`html-text`), shared by the markdown renderer and the rte slugger.
**Consequences:**
- Same browser-only-sanitize pattern is the template for the remaining Phase 6 consumers (blog-detail task 314; home-intro when it migrates) and for the future AST renderer's HTML-cache fallback.
- BE keeps `isomorphic-dompurify` (jsdom) — it runs in plain Node, unaffected.
- A cache written under an *older/looser* whitelist would be emitted verbatim during SSR and only cleaned on the client (a hydration warning + client strip). Acceptable: the cache is authored content, BE-sanitized at write time; the browser pass is the belt-and-braces.
- `<rte-render-html>` gained an optional `contentClass` input so the rendered `<p>/<h2>` land directly under a consumer's prose class (e.g. `landing-prose`), preserving `_prose.scss`'s direct-child rhythm.

### ADR-020: Obsidian Importer — Stateless Markdown→Editor-JSON Convert-and-Prefill, Not a Runtime Path (Task 318)

**Status:** Accepted (2026-06-30)
**Context:** After the RTE epic, the runtime never deals in Markdown for long-form fields — content is the `*Json`/`*Html`/`*SchemaVersion` triple. The Obsidian importer is the *only* remaining place that turns Markdown into editor JSON. Task 311 (S3) had removed the console form's client-side Markdown import, leaving the conversion utilities (`convertObsidianMarkdown`, `extractTitleFromMarkdown`) stranded as dead exports in the console runtime lib.
**Decision:**
1. **Conversion = `marked` → HTML → Tiptap `generateJSON`**, not `prosemirror-markdown`. `generateJSON(html, defaultExtensions)` (from `@tiptap/html/server`) reuses the *exact* `defaultExtensions` schema that `generateHTML` serializes back with, so an import round-trips perfectly. `prosemirror-markdown` would need a hand-written token→node spec against the custom schema. `marked` is added as a runtime dependency (the convert endpoint is a live admin route); it ships only in the API bundle — landing never imports it.
2. **Importer is the sole owner of the legacy Markdown utilities.** They moved to `apps/api/src/modules/blog-post/import/`: pure string helpers in `obsidian-import.util.ts` (dependency-free, unit-tested directly), ESM conversion in `markdown-to-doc.ts` (mocked in unit tests). They no longer ship to any FE runtime bundle.
3. **Convert-and-prefill, NOT create-and-persist** *(revised after manual testing — superseded the original "import creates the post" design)*. The endpoint is a **stateless query**, `POST /admin/blog/convert-markdown` (`ConvertMarkdownQuery`/`Handler`, no DB write), returning `{ title, contentJson: EditorDocument, warnings }`. The console **prefills the editor** with the converted doc (sets title if empty, marks the form dirty) and the author reviews + Saves through the normal create/update path — so the triple is produced by the existing save flow, validation happens once at Save (not at import), and a bad import never persists. The earlier design (BE `ImportMarkdownCommand` building the triple + persisting on import) was removed because it saved immediately, re-validated like Save, and trapped image-error nodes in a post the author couldn't easily discard.
4. **One-shot tool, not a continuous flow.** Invoked manually via a console "Import Markdown" button (create mode) that converts the file and prefills the editor — no auto-running flow. Image embeds/local/remote images are stripped during conversion and surfaced as an aggregated warning (image-ref/Media auto-wiring deferred — author re-inserts via the picker), so nothing gets stuck in the editor.
5. **The `@tiptap/html/server` subpath is loaded via a `new Function('s','return import(s)')` indirection** so webpack/ts-loader never sees the specifier statically (the magic-comment `/* webpackIgnore */` was stripped by ts-loader, compiling an empty context that threw at runtime); Node resolves it natively in this Node-only importer.
**Consequences:**
- Real conversion (ESM `marked` + jsdom-backed Tiptap server) can't run in the api *unit* jest env (which mocks that ESM tree); it's covered by the **api-e2e** convert spec against a live server (no-persist, title extraction, JSON structure h2/list/code-block, sanitized HTML, image warnings). Unit specs cover the pure helpers + the query handler (`convert-markdown.query.spec.ts`, ESM mocked).
- Because convert is now a pure query with no persistence, the importer adds **zero** legacy-column writes — the legacy `content` column is only touched by the normal create/update path (tracked for removal in task 363).

### ADR-021: Shared-UI Lib Structure — Bucket Taxonomy + One Lib Per Scope (Task 380)

**Status:** Accepted (2026-06-30)
**Context:** The three `type:shared-ui` libraries diverged in internal layout with no documented standard (surfaced in task 311 when placing a vendor stylesheet). `libs/shared/ui` was additionally split into three separate Nx projects (`ui-pipes`, `sidebar`, `shared-ui-styles`) while landing/console were each one monolithic lib. Researched design-system conventions (Angular Material/CDK, Nx guidance, MUI/Carbon/Chakra, Spartan/Taiga/ng-zorro) before deciding.
**Decision:**
1. **Bucket taxonomy** for shared-ui libs: `components/ directives/ pipes/ services/ styles/`, buckets directly under `src/` (no `lib/` tier), flat folder-per-component inside `components/` (no sub-categories). Justified because our libs are *multi-concern* (Carbon/Chakra/React-DS pattern); a components-only lib would more idiomatically be flat-at-root (Material/MUI).
2. **Two placement rules:** (A) a folder → the bucket of its *primary* artifact, co-located helpers ride along; (B) cross-kind subsystems (old `shell/`, `motion/`, `keyboard/`) are dispersed **strictly by kind** — no "subsystem buckets." Compound components (sidebar) stay as one `components/<family>/` folder.
3. **Single root `index.ts` public API**, lib non-buildable, **no secondary entry points** (internal/unpublished → esbuild tree-shakes a single barrel of standalone, `sideEffects:false` components fine). Each component keeps a sub-barrel re-exported by the root.
4. **One `shared-ui` lib per scope.** Consolidated `libs/shared/ui/{ui-pipes,sidebar,shared-ui-styles}` (3 projects) into ONE `shared-ui` project (`components/sidebar/` + `pipes/` + global `styles/`). Every scope now has one shared-ui lib with the same structure. Global foundation tokens stay in `libs/shared/ui/src/styles/` consumed via `includePaths`.
5. **Documented exceptions:** console `rx/` bucket (the `withListLoading` operator depends on a ui service, so it can't move to `shared-util` — `util` may not depend on `ui`); landing's local token palette file is named `palette.scss` (under `styles/tokens/`, like the global foundation) so the bare `tokens/colors` includePath still resolves to the global file rather than being shadowed; `services/` inside a `type:ui` lib (our shared-ui libs ship non-data services — conscious deviation from Nx's "ui injects no services").
6. **Doc split:** shared-ui macro-structure lives in the new `.context/patterns-lib-structure.md`; `patterns-file-structure.md` (the §8 shared/ui subsection removed) keeps only the micro conventions (filenames, roles, folder-per-component within a feature).
**Consequences:**
- Migration was structure-only (Stages: console → landing → consolidation → docs); `nx build console` + `nx build landing` green throughout, no template/visual change. Consumers import via path alias so they were unaffected except the 11 that imported the now-removed `@portfolio/shared/ui/{pipes,sidebar}` aliases (repointed to `@portfolio/shared/ui`).
- Shared-ui bucket structure is **convention-enforced** for now — `fe-naming` lint excludes shared libs. Adding lint coverage is a tracked follow-up. Shared-ui selector prefix is `ui-` (kebab) / `ui` (camelCase directive).
- 3 pre-existing lint errors in console-shared-ui (quick-look a11y, an RTE spec selector) were exposed but are unrelated to this refactor (files moved verbatim) — left for a separate cleanup.
- Follow-on cleanups (same session): (a) landing's local tokens folded into `styles/tokens/` (palette-rename trick, see §5 exception) so landing matches the `shared-ui` layout; (b) the `unsaved-changes.dialog` bundle (dialog **@Component** + `unsavedChangesGuard` + `onBeforeUnload` + `HasUnsavedChanges`) was **relocated from `console-shared-util` → `console-shared-ui/components/`** — a component (and its dialog-opening guard) does not belong in a util lib, and the guard is coupled to the component (same `util`-can't-depend-on-`ui` constraint as `withListLoading`). ~21 consumers repointed to `@portfolio/console/shared/ui`; console build green.

### ADR-022: Prose Block Renderer — AST-First Read-Path with Graceful HTML Fallback (epic `redoc-blocks`)

**Status:** Accepted (2026-07-01)
**Context:** The RTE epic (ADR-019/020) landed rich text on landing via `[innerHTML]="contentHtml"` + a `data-block` hydration directive that scanned for `image-ref` and mounted a component. That islands-on-dead-HTML model is correct for **one** block type but doesn't scale to a Gutenberg/Portable-Text CMS model (many author-composed blocks, each with UI *and* logic). It also can't carry an Angular directive into prose, so in-content figures could never get the lightbox (deferred from the lightbox epic). This epic renders the **canonical JSON AST directly into an Angular component tree via a DI registry** instead. The 7 decisions D1–D7 were locked 2026-06-03; this ADR records what actually shipped, including the deviations decided during build.
**Decision:**
1. **AST is the read-path source of truth; the HTML cache is demoted to a fallback (D1/D7), but retained — not deleted.** `project-detail`/`blog-detail` render `<rte-render [doc]>` when `bodyCanonical`/`contentCanonical` is present, else fall back to `<rte-render-html [html]="…Html">`. This is a **graceful, per-row** cutover: un-migrated content still renders via the exact old path, so no data backfill is required to ship. `useAst()` guards on `content.length > 0`. Full removal of the fallback branch (+ `hydrateImageRefs` + the `addHeadingAnchors` read-time slugger) is a follow-up gated on a data backfill and on task 363 (drop legacy columns) / 323 (llms.txt consumes the HTML cache). The HTML path remains the **only** surviving `[innerHTML]` binding (RSS/llms.txt/OG/no-JS).
2. **Own contract, decoupled from `document-engine` (D2/D3).** `PortableNode`/`PortableDocument` + per-block Zod attr schemas live in the Angular-free `rte-core` (deep alias `…/rte-core/portable`, so the BE imports the schemas at runtime without bundling Angular). A single BE write-time adapter (`rich-text.adapter.ts`) normalizes E's Tiptap JSON → our canonical and persists it into new `bodyCanonical`/`contentCanonical` columns (migration `add_prose_block_canonical_columns`). E schema drift touches only the adapter.
3. **Block registry = one `provideBlockRenderers` entry per block (D4/D5).** The renderer walks the tree and injects via `NgComponentOutlet` (declarative → SSR + incremental hydration native, no manual `createComponent`). `image-ref` + `gallery` shipped as thin wrappers over the **lightbox-enabled** `landing-figure`/`landing-gallery` — so **in-content prose figures gain the full-screen viewer** here (the sanctioned fix for the `[innerHTML]` limitation). `RenderContext.media` is a synchronous lookup over the page's pre-resolved `mediaRefs` map (SSR-safe, no fetch at render time).
4. **`gallery` is a dormant seam.** Full Zod schema + block component + registration exist, but there is **no adapter path** (document-engine has no gallery node yet). It proves "register a new block = one entry" end-to-end (registry → render → SSR test) without inventing a fake upstream. When E grows a gallery node, only the adapter changes.
5. **Block components live inside the scope's one shared-ui lib, in a sanctioned `components/blocks/` sub-bucket** — NOT a 4th flat landing lib and NOT loose in `components/`. This is the single documented exception to ADR-021 §1's "no sub-categories inside `components/`" (recorded in `patterns-lib-structure.md`). Rationale: block components are a coherent editor-facing family; a whole lib for them would be over-structure.
6. **The renderer owns heading slugs; the consumer ToC reads them back.** `collectHeadings` (pure, in rte-core) walks the doc in reading order producing `{ node, id, text, level }` with the **same** slugify + dedup rule the landing HTML slugger used. `RteRender` stamps `[id]` on h2–h4 and exposes `headings()`; `project.detail`/`blog.detail` build their ToC from `viewChild(RteRender).headings()`. One slug source → scrollspy anchors always match the ToC. The `landingProseAnchors` click-interceptor is a no-op on the AST path (links force `target="_blank"`).
7. **Security = whitelist the tree, not a string (D6).** Write-time: adapter whitelists node `type` + Zod-validates attrs (unknown dropped, `javascript:` URLs blocked). Read-time: registry renders only known types; unknown → a dev-only placeholder that **never throws** and never breaks sibling nodes. Inline marks are declarative nested elements (D5b); link marks force `target="_blank" rel="noopener nofollow"`.
**Consequences:**
- Angular 21 `renderApplication` changed: the callback receives a `BootstrapContext` that MUST be forwarded to `bootstrapApplication(Root, config, context)` or SSR throws NG0401. The SSR crawler-completeness proof (`prose-blocks.ssr.spec.ts`) runs a real `renderApplication` under the zoneless jest env and asserts structural tags/marks/images render with no ProseMirror/tiptap/contenteditable leakage.
- `getLocalized()` is typed to return `string`, so the per-locale canonical object needs `as unknown as PortableDocument` at the two consumer read sites.
- Template-only bindings (`bodyDoc()`) are NOT caught by `tsc --noEmit` — only AOT (`nx build landing`) catches a `private` field bound in a template. `nx build landing` is the gate for these components, not `tsc`.
- Verification: rte-core 38, rte-renderer 17, ui blocks 12 (incl SSR), API project/blog/rich-text 215; `nx build landing` AOT green; lint clean.

### ADR-023: RTE Field Column Contract — Every Rich-Text Field Carries a Canonical Column (Task 312)

**Status:** Accepted (2026-07-02)
**Context:** ADR-022 added the canonical `PortableDocument` read-path but only wired the two "big body" fields (`project.body`, `blog.content`) with a `*Canonical` column. The other seven RTE fields — `profile.bioLong`, `experience.{description,responsibilities,highlights}`, `technicalHighlight.{challenge,approach,outcome}` — kept only the original `*Json`/`*Html`/`*SchemaVersion` triple. The write pipeline (`RichTextService.toCanonicalForm*`) **always computes** `canonical`, but those seven repos silently **discarded** it for lack of a column. This surfaced in task 312: `home-intro` needs a structured (per-paragraph) doc to drive its lamp/pen interaction, but the API returned only the raw Tiptap `bioLongJson` (root-wrapped `content:{type:'doc',…}`) — the wrong shape for the AST read-path — with no canonical form stored anywhere.
**Decision:**
1. **A rich-text field's storage contract is the full four-column set — `<field>Json`, `<field>Html`, `<field>SchemaVersion`, `<field>Canonical` — no exceptions.** Every existing RTE field is brought up to this set (migration `add_rte_canonical_columns`, expand-only nullable JSONB). Any future field that moves from plain text to RTE must ship all four columns; there is no "HTML-only" or "Json-only" RTE field.
2. **The contract is self-enforced by a test, not just documented.** `apps/api/src/rte-canonical-contract.spec.ts` parses `schema.prisma`, treats every `<field>SchemaVersion` column as the marker of an RTE field group, and asserts the sibling `Json`/`Html`/`Canonical` JSONB columns all exist. A new RTE field missing its canonical column fails CI. This is the reusable guard that makes the rule hold for fields added after this task.
3. **`canonical` is persisted uniformly at the entity layer.** Each field's entity writes `<field>Canonical: rich.canonical` (mirroring how `project`/`blog` already do it), so the value the pipeline already computes is no longer dropped. The `*Json` column stays the lossless Tiptap re-edit source; `*Canonical` is the engine-agnostic AST read source; `*Html` stays the sanitized fallback cache.
4. **Storage parity now; API/render adoption per-need.** All seven fields get the column + persist + backfill immediately, but only `profile.bioLong` is exposed through the presenter and read by landing in this task (it is the only one with a structured-render consumer). The other six have canonical stored and ready; switching their landing render from `<rte-render-html>` to `<rte-render [doc]>` later is a presenter + read-site change with **zero** further DB work.
5. **Existing rows are backfilled by a generalized, table-driven script.** `backfill-canonical.ts` is rewritten from a hardcoded two-field script to a declaration table `{ model, field }[]` covering all nine RTE fields. For each row with a `*Json` but null `*Canonical`, it re-runs the stored Tiptap through `RichTextService` and writes back only the canonical column (idempotent, non-destructive; `--force` recomputes).
**Consequences:**
- The seven new columns are nullable and lazy-filled: a row's canonical is null until the next console save OR a backfill run. Landing guards on `content.length > 0` (as project/blog already do), so a null canonical renders nothing rather than crashing.
- The contract test couples to a naming convention (`*SchemaVersion` marks an RTE group). If a future non-RTE field is ever named `<x>SchemaVersion`, the test would wrongly demand canonical columns for it — acceptable, since `SchemaVersion` is reserved for RTE here.
- Verification: contract spec 10; migration expand-only (safe, no data transform); backfill idempotent. Task 312 read-swap + seed fix ride on top.
