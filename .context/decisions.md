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
**Context:** Console pages with many fields (Profile ~30 fields, Experience ~25, Project ~14 + relations) currently render as flat single-column forms with all space biased to the left half of the viewport. Researched 5 patterns (wizard, progressive single-page + scrollspy, tabs, accordion, one-thing-per-page) against project needs. Cross-page nav (Profile / Account / Notifications / Billing) and in-page nav both needed. See `.context/design/patterns/long-form-layout.md` for full pattern catalog and decision matrix.
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

| Module type                                                         | Save mechanic                                   | BE shape                                                       | Examples                            |
| ------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| **Settings / Preferences** (loose collection of independent fields) | Per-section save with section-level Save button | Section commands + section value objects + section Zod schemas | Profile, Notifications, Billing     |
| **Domain entity** (transactional, cross-field invariants)           | Atomic save with sticky save bar                | Single command, monolithic aggregate, full schema validation   | Experience, Project, Article, Skill |

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
2. **E4-C remains the default** for all other landing sections (Selected Work, Stack, Story, Get in Touch, Footer Banner). §3 is the _one_ section where richer surface treatment is permitted, justified by it being the identity/availability/contact glance-zone where craft visibly matters.
3. **Palette discipline preserved.** No new colors introduced — indigo accent + ink-0/1/2 + landing-text-300..600 only. No rainbow/saturated gradients. Aurora/glow uses existing accent at low opacity.
4. **Motion still considered.** Any animation must be subtle, optional, and respect `prefers-reduced-motion`.
   **Consequences:**

- Task 284 prototype gallery extends with 7 PF-\* options (spotlight bento, aurora mesh, editorial magazine, showcase artifact, breaking-boundary, brutalist mono, dimensional layers).
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
**Context:** Task 313 made `/projects/:slug` the first _prerendered_ landing route to render rich text via `<rte-render-html>`. Two things surfaced:

1. `<rte-render-html>`'s `SafeHtmlPipe` ran the shared `sanitizeRichText` (rte-core), which imports `isomorphic-dompurify`. That package executes `new JSDOM()` at module top-level; jsdom is CommonJS and references `__dirname`, which is undefined in Angular's ESM SSR/prerender bundle. Result: `Error in handleRoute for '/projects': __dirname is not defined` — both `nx build landing` (prerender) and the dev SSR server failed. Task 308 had claimed the renderer "SSR-safe" but it was never exercised in a prerendered route.
2. AC asked whether `Project.sections[*].body` is a separate rich-text concept. The current `Project` model has **no** `sections` field — body is a single long-form field.
   **Decision:**
3. **Read-time sanitize is browser-only on landing.** The `*Html` cache is already write-sanitized by the BE (`RichTextService` → `sanitizeRichText`, same `RICH_TEXT_WHITELIST`). `SafeHtmlPipe` now: on **server/prerender** trusts the cache as-is (`bypassSecurityTrustHtml`, no DOMPurify); in the **browser** re-runs DOMPurify as defense-in-depth. DOMPurify is idempotent on already-clean HTML, so the browser pass matches the server output → no hydration mismatch for a correctly write-sanitized cache.
4. **Browser sanitize uses plain `dompurify`, not `isomorphic-dompurify`.** Plain dompurify no-ops gracefully without a `window` (never touches jsdom), so it is safe to _import_ in the server bundle while only being _called_ in the browser. New file `libs/shared/features/rte-renderer/src/lib/sanitize-browser.ts` (`sanitizeRichTextBrowser`) mirrors rte-core's anchor-hardening + `id`-on-headings-only hook and the whitelist.
5. **Constants imported via a constants-only entry.** `sanitize-browser.ts` imports `RICH_TEXT_WHITELIST`/`ID_ALLOWED_TAGS` from `@portfolio/shared/features/rte-core/constants` (new tsconfig path → `rte.constants.ts`), NOT the rte-core barrel — the barrel `export *`s `rte.sanitize`, which would drag `isomorphic-dompurify` back into the server bundle.
6. **`id` whitelisted on headings only.** `RICH_TEXT_WHITELIST.ALLOWED_ATTR` now includes `id`; the shared sanitize hook strips `id` from every element except `h2`/`h3`/`h4` (no anchor spoofing on `<a>`). Applies to both BE write and FE read gates.
7. **Project body = one rich-text field; no `sections`.** No `Project.sections` is introduced. The case-study body is the single `bodyJson`/`bodyHtml` field; ToC anchors come from a read-time slugger (`addHeadingAnchors`, `@portfolio/landing/shared/util`) over `bodyHtml`. Generic text helpers (`slugify`/`escAttr`/`decodeHtml`) also moved to that lib (`html-text`), shared by the markdown renderer and the rte slugger.
   **Consequences:**

- Same browser-only-sanitize pattern is the template for the remaining Phase 6 consumers (blog-detail task 314; home-intro when it migrates) and for the future AST renderer's HTML-cache fallback.
- BE keeps `isomorphic-dompurify` (jsdom) — it runs in plain Node, unaffected.
- A cache written under an _older/looser_ whitelist would be emitted verbatim during SSR and only cleaned on the client (a hydration warning + client strip). Acceptable: the cache is authored content, BE-sanitized at write time; the browser pass is the belt-and-braces.
- `<rte-render-html>` gained an optional `contentClass` input so the rendered `<p>/<h2>` land directly under a consumer's prose class (e.g. `landing-prose`), preserving `_prose.scss`'s direct-child rhythm.

### ADR-020: Obsidian Importer — Stateless Markdown→Editor-JSON Convert-and-Prefill, Not a Runtime Path (Task 318)

**Status:** Accepted (2026-06-30)
**Context:** After the RTE epic, the runtime never deals in Markdown for long-form fields — content is the `*Json`/`*Html`/`*SchemaVersion` triple. The Obsidian importer is the _only_ remaining place that turns Markdown into editor JSON. Task 311 (S3) had removed the console form's client-side Markdown import, leaving the conversion utilities (`convertObsidianMarkdown`, `extractTitleFromMarkdown`) stranded as dead exports in the console runtime lib.
**Decision:**

1. **Conversion = `marked` → HTML → Tiptap `generateJSON`**, not `prosemirror-markdown`. `generateJSON(html, defaultExtensions)` (from `@tiptap/html/server`) reuses the _exact_ `defaultExtensions` schema that `generateHTML` serializes back with, so an import round-trips perfectly. `prosemirror-markdown` would need a hand-written token→node spec against the custom schema. `marked` is added as a runtime dependency (the convert endpoint is a live admin route); it ships only in the API bundle — landing never imports it.
2. **Importer is the sole owner of the legacy Markdown utilities.** They moved to `apps/api/src/modules/blog-post/import/`: pure string helpers in `obsidian-import.util.ts` (dependency-free, unit-tested directly), ESM conversion in `markdown-to-doc.ts` (mocked in unit tests). They no longer ship to any FE runtime bundle.
3. **Convert-and-prefill, NOT create-and-persist** _(revised after manual testing — superseded the original "import creates the post" design)_. The endpoint is a **stateless query**, `POST /admin/blog/convert-markdown` (`ConvertMarkdownQuery`/`Handler`, no DB write), returning `{ title, contentJson: EditorDocument, warnings }`. The console **prefills the editor** with the converted doc (sets title if empty, marks the form dirty) and the author reviews + Saves through the normal create/update path — so the triple is produced by the existing save flow, validation happens once at Save (not at import), and a bad import never persists. The earlier design (BE `ImportMarkdownCommand` building the triple + persisting on import) was removed because it saved immediately, re-validated like Save, and trapped image-error nodes in a post the author couldn't easily discard.
4. **One-shot tool, not a continuous flow.** Invoked manually via a console "Import Markdown" button (create mode) that converts the file and prefills the editor — no auto-running flow. Image embeds/local/remote images are stripped during conversion and surfaced as an aggregated warning (image-ref/Media auto-wiring deferred — author re-inserts via the picker), so nothing gets stuck in the editor.
5. **The `@tiptap/html/server` subpath is loaded via a `new Function('s','return import(s)')` indirection** so webpack/ts-loader never sees the specifier statically (the magic-comment `/* webpackIgnore */` was stripped by ts-loader, compiling an empty context that threw at runtime); Node resolves it natively in this Node-only importer.
   **Consequences:**

- Real conversion (ESM `marked` + jsdom-backed Tiptap server) can't run in the api _unit_ jest env (which mocks that ESM tree); it's covered by the **api-e2e** convert spec against a live server (no-persist, title extraction, JSON structure h2/list/code-block, sanitized HTML, image warnings). Unit specs cover the pure helpers + the query handler (`convert-markdown.query.spec.ts`, ESM mocked).
- Because convert is now a pure query with no persistence, the importer adds **zero** legacy-column writes — the legacy `content` column is only touched by the normal create/update path (tracked for removal in task 363).

### ADR-021: Shared-UI Lib Structure — Bucket Taxonomy + One Lib Per Scope (Task 380)

**Status:** Accepted (2026-06-30)
**Context:** The three `type:shared-ui` libraries diverged in internal layout with no documented standard (surfaced in task 311 when placing a vendor stylesheet). `libs/shared/ui` was additionally split into three separate Nx projects (`ui-pipes`, `sidebar`, `shared-ui-styles`) while landing/console were each one monolithic lib. Researched design-system conventions (Angular Material/CDK, Nx guidance, MUI/Carbon/Chakra, Spartan/Taiga/ng-zorro) before deciding.
**Decision:**

1. **Bucket taxonomy** for shared-ui libs: `components/ directives/ pipes/ services/ styles/`, buckets directly under `src/` (no `lib/` tier), flat folder-per-component inside `components/` (no sub-categories). Justified because our libs are _multi-concern_ (Carbon/Chakra/React-DS pattern); a components-only lib would more idiomatically be flat-at-root (Material/MUI).
2. **Two placement rules:** (A) a folder → the bucket of its _primary_ artifact, co-located helpers ride along; (B) cross-kind subsystems (old `shell/`, `motion/`, `keyboard/`) are dispersed **strictly by kind** — no "subsystem buckets." Compound components (sidebar) stay as one `components/<family>/` folder.
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
**Context:** The RTE epic (ADR-019/020) landed rich text on landing via `[innerHTML]="contentHtml"` + a `data-block` hydration directive that scanned for `image-ref` and mounted a component. That islands-on-dead-HTML model is correct for **one** block type but doesn't scale to a Gutenberg/Portable-Text CMS model (many author-composed blocks, each with UI _and_ logic). It also can't carry an Angular directive into prose, so in-content figures could never get the lightbox (deferred from the lightbox epic). This epic renders the **canonical JSON AST directly into an Angular component tree via a DI registry** instead. The 7 decisions D1–D7 were locked 2026-06-03; this ADR records what actually shipped, including the deviations decided during build.
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

### ADR-024: Console Long-Form → Vertical-Tab Section Nav; Atomic-Block FE Split (epic `console-tab-redesign`)

**Status:** Accepted (2026-07-10)
**Context:** Console settings-style forms render as one tall long-form (scrollspy rail + all section cards stacked in an internally-scrolling pane). Profile alone was ~8,200px (about 10 screens); locating a field meant scrolling far. Five forms share this `LongFormLayout + ScrollspyRail` chassis (`profile`, `skill.form`, `project.form`, `experience.form`, `ddl-long.form`). An audit also retired the prior epic premise: console has no full-width tab component to redesign; only `segmented-control` (inline-flex) exists. Separately, profile's "Landing Content" section is a ~10-field monster, and its BE command `updateLandingContent` is an **atomic full-replace** (schema requires all keys; handler rebuilds the whole `LandingContentBlocks`).
**Decision:**

1. **Replace the long-form chassis with vertical-tab section navigation.** A grouped rail (desktop) / horizontal scrollable strip (`<1024px`) swaps to show one section at a time, instead of scrolling to it. Horizontal tabs were rejected: 8+ sections with long labels exceed the NN/g 5–7 guideline and Material 3 would force scrollable tabs (hidden tabs, worse scanning). Vertical is the natural evolution of the existing rail.
2. **Sections stay mounted via `[hidden]`, not `@if`.** Keeping every section in the DOM preserves unsaved edits and the per-section `status()` (untouched/editing/saved/error) that feeds the rail icons across tab switches. Deep-link is preserved via URL fragment, read reactively so browser back/forward also switches tabs.
3. **The oversized Landing Content section is split FE-only, never BE.** Because the BE block is atomic, the three sub-tabs (grouped by where the copy renders: **Home page** / **Footer** / **About page**) share a single form, a single save, and one shared `StickySaveBar`; the whole block is always sent on save (`form.getRawValue()`), so no field is wiped. Consequence accepted: status is **shared** across the three landing sub-tabs (editing any one marks all three), which is the honest UX for one atomic save unit. The sub-tabs buy findability, not independent saves.
4. **Pilot on profile, extract the shared component on the 2nd use.** The tab-shell lives inline in `profile` for now; it graduates to a `libs/console/shared/ui` component when the first of the remaining four forms is migrated, avoiding premature abstraction.
   **Consequences:**

- Profile scroll dropped from ~8,200px to ~1,500px; verified: tab swap, deep-link, mobile strip, landing dirty → sticky bar → discard-confirm → revert, all with 0 console errors and no BE/data change.
- Four long-rail forms + the shared-component extraction remain (see epic requirements 6–10). The `/ddl/profile-tabs` prototype has diverged (it showed a 4-way landing split) and is slated for removal.
- The atomic-block-with-shared-save pattern is reusable for any future FE split of an atomic BE resource: split for navigation, keep one form + one save.

### ADR-025: Console Page Layout — Boxed-Centred Standard (Two Widths)

**Status:** Accepted (2026-07-10), supersedes ADR-024's "hybrid left-aligned" layout note
**Context:** Console page widths were fragmented ("manh mún"): some pages left-aligned with no cap, some centred with a `max-width`, some full-width — and a first pass at a "hybrid left-aligned" standard (ADR-024) capped forms/detail to a **left-aligned** 768px column. On wide monitors that left a large empty void on the right, which the user rejected. Three page archetypes exist: lists (`.crud-page`, 13 pages), detail (`.detail-page`, 9 pages), section-tabs forms (5 bespoke roots). A `/ddl` anatomy prototype (list/detail/form) was used to settle the model interactively.
**Decision:**

1. **Every page is a horizontally-centred box** (`margin-inline: auto`), not left-aligned — balanced margins on both sides, no one-sided void.
2. **Two widths only**, as CSS custom properties in `_page.scss`: `--console-page-max: 1440px` (lists + forms, which carry a section rail and need the width) and `--console-reading-max: 1200px` (detail reading column). The reading column moved 768 → 1200 per the user's "ít nhất 1200px"; accepted that this reads as ~full-width on typical laptops (intended).
3. **Bake the standard into shared classes for near-zero-churn rollout.** `.crud-page` and `.detail-page` gained the box + centring directly, so all 22 list/detail pages inherit automatically. Forms add a composable `.console-page` utility (width + centring only, no layout) alongside their bespoke root class. `.crud-page` keeps `height:100%` so the table scrolls naturally with the shell (no `flex:1` fill on the table group — user: "table sẽ tự scroll khi có nhiều record").
4. **List toolbar search fills the row, clamped 300–1200px** (`console-filter-search` → `flex-1 min-w-[300px] max-w-[1200px]`), so filters/actions after it sit to the right. Applied on the shared component → all lists inherit.
   **Consequences:**

- One documented standard (console-cookbook "Max-Width Rules"); the `/ddl` anatomy pages remain the living reference.
- Intentional exceptions kept: auth/narrow forms (`max-w-md`), blog post editor (own 720px prose column), media galleries (full-width grids), dashboard.
- Detail metadata may live in a section **header** (title + right-aligned badge/action) or **footer** (timestamps) — demonstrated in the anatomy detail; both are sanctioned placements.

### ADR-026: Console Record View — Split Chassis with a Density Switch (Read Views)

**Status:** Accepted (2026-07-19)
**Context:** The nine console detail pages shared one row primitive, `.detail-field` (fixed 140px label + value), applied to every field regardless of shape. Measured on `/projects/<id>` at 1440×900: total scroll 2617px (3.3 screens) and prose rendered at 923px ≈ **130 characters per line**, roughly 1.8× the comfortable ceiling. Because scalars (slug, order, status, skills) sat _between_ prose blocks in one serial column, `displayOrder` was three screens below the fold. Sparse records were flat and unreadable in a different way: four sections at identical visual weight, nothing legible at a glance. `message.detail` had already forked the primitive into a private `.message-meta` / `.meta-row` copy — the clearest signal that it did not fit. A prior prototype (`/ddl/anatomy-detail`) added a segmented control, which fragmented small records without fixing large ones, and was never adopted.
**Decision:**

1. **Split by data shape, not by topic.** Short scalars go to a sticky properties rail (`console-property-list`); long-form content keeps the reading column (`console-record-field`, capped at 68ch). A record's two halves never share a row template again.
2. **Chassis = `console-record-layout`**, 2fr content / 1fr aside (the Polaris resource-details ratio; Linear and Jira read the same). One column below 1024px.
3. **Degradation is declarative, not conditional.** The two-column grid engages only when both slots carry content (CSS `:has`). Attribute-only records (tag, category, skill) render as a single properties panel with no branch at the call site.
4. **Density is a switch on one chassis, not a second layout.** `console-record-fold` compresses a heavy child to one row that still carries a **gist** of its content. A fold without a gist has become a tab; tabs are rejected for read views precisely because they hide siblings. Measured on the same record: 1949px expanded, 1025px collapsed (~1.2 screens, −61% vs today).
5. **Three levels that never share a type treatment**: section (a group the record owns) → field / item (a field, or a member of a collection) → sub-part. A highlight is a child of "Technical highlights", not a sibling of "Motivation".
6. **Absence is reported once, at the level where it is actionable.** Field-level gaps render inline as one muted line inside a section that is already on screen; whole absent sections fold into `console-record-empty-sections`. Locale gaps are their own state — the view never falls back silently to the other language, because that hides the gap the author needs.
7. **Partial state is signalled in the section header** (`gaps` input), so a half-written record is legible from the top of the page instead of discovered by scrolling.
   **Consequences:**

- Styles live in `styles/patterns/_record-view.scss`, not in the components: every part is content-projected and scoped styles do not reach projected content. Same reasoning as `.detail-page` / `.crud-page`.
- Forms keep `console-section-tabs` (ADR-024) — the chassis is not unified. What must converge is the **section vocabulary**: form section names and order match the read view 1:1, so "Story" means the same place in both.
- `/ddl/anatomy-detail` is rebuilt on this chassis in the same change. Two conflicting reference pages is the failure mode that made the first prototype inert.
- Superseded for read views: `.detail-field`, `.detail-card`, `.detail-section` in `_detail.scss`, and the private `.message-meta` fork.

### ADR-027: `/document-engine` Engine Weight — Accept the Deferred Split, No Further Work

**Status:** Accepted (2026-07-26) — closes item C2-A of the `/document-engine` ledger (task 361)
**Context:** The `/document-engine` page mounts the real editor (`RteTiptapEditor` + `@phuong-tran-redoc/document-engine-*@0.1.4`, i.e. TipTap/ProseMirror). The content-authoring ledger carried a standing worry — "+1.6 MB into the SSR bundle" — flagged as a decision to make before closing the page's tech-debt. The fear was that route-level `documentEngineProviders()` (→ `provideDocumentEngineDemo()`) forces the whole engine into the eager/server bundle. A production build (`nx build landing --configuration=production`, 2026-07-26) was run to settle it with numbers rather than reasoning.
**Decision:** Accept the current structure as-is. Do **not** restructure the editor into a further-deferred child component. The measured build shows the engine is already code-split cleanly and never reaches a user eagerly, so the restructure would buy nothing observable.

Evidence (measured, prod build):

- **Initial/eager browser bundle** = 1.21 MB raw / 260.92 kB transfer, with the engine **absent** — its chunks are in the Lazy section.
- Engine ships as **lazy** browser chunks only: `document-engine-angular` 241.68 kB (50.00 kB gzip) + `document-engine` core 75.08 kB (16.55 kB gzip), fetched by `@defer (on viewport)` when the editor scrolls into view.
- Server build splits the same engine into `.mjs` chunks (~317 kB raw) that sit on disk but do not execute for this route: `document-engine` is `RenderMode.Prerender`, and a prerendered `@defer` renders its `@placeholder`, so nothing engine-related is server-rendered or shipped.

**Consequences:**

- The earlier "eager provider" hypothesis is disproved by the build output — the engine is in named lazy chunks, not inlined into `main`/`server.mjs`. No code change is warranted.
- The lever that would matter is the engine's own size, owned upstream in the `document-engine` repo, not by this consumer.
- Re-open only if the editor stops being `@defer`'d, the route stops prerendering, or a build regression pulls the engine into the Initial set. The one-line guard: engine chunks must stay under "Lazy chunk files", never "Initial chunk files".
- Item **C2-B** (removing the `_document-engine-panels.scss` vendor shim) is **not** covered here — it stays blocked on DE-repo task `de-016` shipping the panel fixes and a version bump past 0.1.4.

### ADR-028: Landing Static UI Copy — One Typed Dictionary, `<landing-t>` Keeps HTML-Rich

**Status:** Accepted (2026-07-27) — task 388 Phase 3
**Context:** Landing's bilingual static copy had grown four parallel mechanisms with no single source: `<landing-t>` slots in templates (57 blocks), `locale() === 'vi' ? … : …` ternaries in TS (39 strings), parallel `*_EN` / `*_VI` constant pairs (10 clusters), and ~120 strings that were only ever written in English. Nothing could answer "which strings are untranslated?" and a wording fix meant hunting the mechanism first. This is separate from **authored content** from the API (`Profile.*`, `project.oneLiner`, …), which already resolves through `translatable` / `getLocalized` with prod as source of truth and is explicitly out of scope.

**Decision:** Split by copy shape, not by mechanism preference.

1. **Plain-string copy → one typed dictionary.** `LANDING_COPY` in `libs/landing/shared/ui/src/services/copy/landing-copy.data.ts`, an `as const satisfies Readonly<Record<string, LandingCopyEntry>>` object of `{ en, vi }` entries under page-namespaced keys (`contact.form.submit.idle`).
2. **TypeScript, not JSON.** The task originally specified JSON. TS won because JSON cannot carry comments, and each entry needs its origin `file:line` beside it to stay findable after migration; `as const` additionally makes `LandingCopyKey` a closed union, so a typo is a compile error rather than a silently missing string.
3. **HTML-rich copy stays in `<landing-t>`.** Any copy carrying markup (an `<em>` accent, an inline `<landing-link>`, a `<time>`, the two full legal documents) is not forced into the dictionary — putting HTML in strings reintroduces a sanitizing problem the RTE contract (ADR-023) already paid for once.
4. **Two read paths over one pure resolver.** `resolveCopy(key, locale)` owns the fallback chain (requested locale → `en` → `vi` → the key itself; returning the key keeps a gap visible instead of collapsing the layout). `LandingCopyService.t(key, localeOverride?)` wraps it in a `computed` for TS; the `landingCopy` pipe wraps it for templates.
5. **The pipe takes locale as a required argument.** A pure pipe does not re-run when a signal it reads internally changes, so the language toggle would leave stale text; passing `locale()` makes it a real pipe input — pure, OnPush-safe, no impure pipe on every CD cycle. It also handles `/privacy` and `/terms` for free, since those drive locale from `?lang=` rather than the site-wide toggle and can pass their own signal, exactly like `<landing-t [locale]>`.
6. **Placement follows the bucket taxonomy, not the task file.** The task proposed `src/i18n/`; `patterns-lib-structure.md` Rule B forbids subsystem buckets, so the dictionary + service live in `services/copy/` (Rule A: primary artifact is the service, data rides along) and the pipe in `pipes/`.

**Consequences:**

- Index-addressed lists stay as arrays where they are read (`EN_MONTHS` / `VI_MONTHS` in `about.hero.data.ts`) — a flat key dictionary would force `common.month.${n}` template keys and lose the type safety that motivated the dictionary.
- Two invariants are enforced by test rather than review: no entry may be empty in both locales, and no value may contain an em-dash or en-dash.
- New static copy goes in the dictionary. Writing a new `locale() === 'vi'` ternary for a plain string is the regression to watch for.
- `<landing-t>` is not deprecated and its docstring stays authoritative for the rich case.

**Amended 2026-07-28 (task 388 closed, 476 keys).** Migrating the remaining English-only strings surfaced two things worth recording, because both were holes in this ADR's own enforcement rather than in its design:

- **The dictionary was never the only shape static copy could take.** A third mechanism existed that the original guardrail did not model: an inline `{ en: '…', vi: '…' }` object resolved through `getLocalized`. That is the right shape for _authored_ content arriving from the API and the wrong one for static copy, so `/document-engine` carried a parallel copy source for months without tripping anything. `landing-copy-contract.spec.ts` now pins all three shapes.
- **An invariant that only checks dictionary values does not cover the site's longest prose.** The em-dash/en-dash ban lived in `landing-copy.spec.ts`, which reads `LANDING_COPY` — so it saw every plain string and none of the HTML-rich copy in `<landing-t>`. Eleven em-dashes sat in the two legal documents. A fourth test now scans rendered template prose in every `.html`, excluding comments and decorative glyphs inside `aria-hidden="true"`.

The generalizable lesson: **an invariant is only as wide as the surface its test reads.** Both escapes were mechanisms or surfaces the spec structurally could not see, not rules anyone broke knowingly.

Accessibility copy (`aria-label`, `sr-only` headings, `aria-live`) is in scope and lives in the dictionary under `a11y.*` (component-owned) or `<page>.a11y.*` (surface-specific); the conventions for it are in `.context/landing-i18n.md` §6.

**Amended 2026-07-28 (post-close review).** Reading the finished system back raised four gaps. Three were fixed; the fourth is a decision to keep the current shape and say why.

- **Interpolation was untyped.** Slots were filled with `.replace('{n}', …)` at 21 call sites, so a missing or misspelled slot shipped a literal brace to the screen. `resolveCopy(key, locale, values)` now types `values` from the entry itself (`CopyValues<K>`), making a wrong or partial fill a compile error; the contract spec covers the half a type cannot — omitting `values` entirely, which has to stay legal because a dynamic key widens to the whole union. `{{customer_name}}` in the `/document-engine` prose is deliberately **not** a slot: it is the product's own template syntax quoted in copy, and both the type and the runtime skip the double-brace form.
- **`t()` is a computed factory, and calling it inside a `computed` nests signals.** Four sites in `contact.ts` did exactly that, against the rule this ADR's own doc already stated. They call `resolveCopy` now, and the constraint is on `t()`'s docblock rather than only in the guide.
- **Three files in `shared/data-access` imported the dictionary**, which the `type:shared-data-access → type:shared-ui` module boundary forbids. The violation was introduced by this task and went unseen because lint was never run against it. The fix is placement, not a rule change: the copy dictionary, the locale service, the meta service and the contact-error mapper are all landing app services, so they live in `shared/ui/src/services/` where `LandingLocaleService` already was. `shared/data-access` is for things that talk to the API.
- **The dictionary stays one eager object with both locales.** Splitting per locale costs a round trip before first paint; splitting per route costs the synchronous `resolveCopy` that keeps SSR trivial. At 476 keys / ~42 KB neither is worth it. A size test now fails at 700 keys or 64 KB, and its message names the answer for when it does fire: split per **route**, keeping both locales together, because route is the axis the reads cluster along.

---

### ADR-029: Landing First-Paint Locale — Read the Request, Not the Bundle

**Status:** Accepted (2026-07-28)
**Context:** `LandingLocaleService.readInitial()` returned `'en'` on the server unconditionally. The service already _wrote_ a `landing_locale` cookie for exactly this purpose, with a comment calling it "future first-paint language matching" — the server just never read it back. A returning Vietnamese visitor therefore got an English first paint that flipped after hydration, and a crawler saw only English. The one exception was `/privacy` and `/terms`, which read `?lang=` from the router and so were the only two pages that server-rendered Vietnamese correctly.

**Decision:** The server answers the same two questions the browser does, in the same order, over whatever transport it has.

|         | already chose   | client preference        |
| ------- | --------------- | ------------------------ |
| browser | `localStorage`  | `navigator.languages`    |
| server  | `Cookie` header | `Accept-Language` header |

1. **`REQUEST` (Angular 19+) is the transport.** Injected optional, so the browser and prerender both get `null` and fall through.
2. **`Accept-Language` is parsed with q-weights.** `en;q=0.7,vi;q=0.9` means Vietnamese; scanning in header order would answer English. Ties keep header order.
3. **`Vary: Cookie, Accept-Language` on every SSR response.** Two visitors asking for one URL can now legitimately get different HTML. Cloudflare only caches hashed assets today, which is precisely the assumption that stops holding one dashboard change later.
4. **Localized pages are `Server`, not `Prerender`.** Prerender runs at build time where there is no request, so a prerendered page can only ship English. `/uses`, `/colophon` and `/document-engine` moved to `Server`; their render is pure template work and correct language beats the milliseconds. `/ddl` stays prerendered — it is the internal design reference, English by nature, and nothing flips.

**Consequences:**

- The `landing_locale` cookie became load-bearing. It is not a preference cache any more; it is the first-paint input.
- `<html lang>` follows for free — the existing effect sets it, and the effect now starts from the right value.
- A first-time visitor whose client asks for neither language still gets English, which is the intended `x-default`.
- The parsers are pure functions with their own spec (`landing-locale.spec.ts`) rather than being reachable only through a running server.

---

### ADR-030: One Writer for the Document Head

**Status:** Accepted (2026-07-28)
**Context:** Every page set its own `<title>` plus three or four `Meta.updateTag` calls. The result was a head that was correct in the parts each page remembered and frozen at `index.html`'s English defaults everywhere else: no page except `/` set `twitter:*`, so every card on X showed the site default; `og:url` pointed at the homepage no matter what was shared; `og:locale` did not exist; and `/projects/:slug` never set `og:title` at all. Nothing was broken enough to notice, because a wrong share card is invisible from inside the app.

**Decision:** A page declares `LandingPageMeta` once and `LandingMetaService.apply()` derives everything that follows from it.

1. **One declaration, eleven tags.** `title` feeds `<title>`, `og:title`, `twitter:title`; `description` feeds the meta description, `og:description`, `twitter:description`; `image` feeds `og:image` and `twitter:image`. A page cannot set half of a pair, because there are no halves to set.
2. **Locale is read by the service, not passed in.** `og:locale` and the description fallback stay right without every caller repeating them. Pages call `apply` from inside an `effect` that already tracks locale, so a language switch rewrites the head the way it rewrites the page.
3. **The service owns `canonical`.** `useLegalPage` kept its `hreflang` alternates and gave up its canonical link; two writers would mean two `<link rel="canonical">` in one head. `path` defaults to the router URL with the query stripped, and the legal pages pass it explicitly because `?lang=` is part of their canonical identity.
4. **Removal is part of applying.** `noindex` from `/404` and `article:*` from a blog post are cleared on the next `apply`, so page-specific tags cannot follow the visitor.

**Consequences:**

- `defaultTitle` / `defaultDescription` take a locale and there is no locale-free shortcut. The old module-load `DEFAULT_TITLE` pair was justified by "SSR renders English anyway", which ADR-029 made false, and the home page had been serving English metadata to Vietnamese visitors because of it.
- Pages got shorter: four `updateTag` calls became one `apply`, and `Title` / `Meta` are no longer injected outside the service.
- The service lives in `shared/ui/src/services/meta/`, with the other landing app services. It talks to no API, so it was never data-access.

---

### ADR-031: Jest Coverage Thresholds Are Measured Floors, Not Aspirations

**Status:** Accepted (2026-07-28)
**Context:** Every CI run on `master` had been red for weeks, and the red was not a broken test. The `ci` job ran ~1,940 unit tests with **zero failures** and still exited 1, because four projects missed a `coverageThreshold` written when the project was young: `landing` asked for 50% and measured 4.17%, `ui` asked for 80% and measured 38.47%, `api` asked for 80% and measured 74.89%, `shared-utils` asked for 90% functions and measured 83.33%. A gate that is always red reports nothing. It had also trained the habit of scrolling past a failed CI badge, which is exactly the habit that lets a real failure through — the ~76 genuinely failing e2e tests (task 386) sat behind the same red badge.

**Decision:** A threshold states what the suite reaches today. Two rules keep it honest.

1. **Narrow the denominator before touching the number.** A file is excluded only when it provably contains no product logic: ambient `.d.ts` (emits no JavaScript), `*.seed.ts` (run by hand against a real DB), `apps/api/scripts/` and `apps/api/prisma/` (one-off backfills and the seed entry), `apps/landing/src/app/pages/ddl/**` (the design-system showcase — ~140 of that app's ~170 files, demo pages documenting the landing UI), and `libs/shared/utils/core/src/lite.ts` (a one-line re-export barrel named something other than `index.ts`). For `api` this alone moved statements from 74.89% to 81.06% and lines to 80.06%, clearing two of its four gates without a single new test.

2. **Never exclude by role suffix.** `*.data.ts`, `*.types.ts` and `*.constants.ts` look like declaration files and are not: `media.constants.ts` holds `validateFile` and `formatFileSize`, `command-palette.types.ts` holds `filterCommands`, `contact-form.types.ts` holds `isContactPurpose`. The filename grammar in `patterns-file-structure.md` names a file's _role_, and role does not imply absence of logic. A suffix-based exclusion list would have silently dropped security-adjacent code out of measurement.

What remained after narrowing was set to the measured value, and it may only move up:

| Project        | statements        | branches   | functions  | lines      |
| -------------- | ----------------- | ---------- | ---------- | ---------- |
| `shared-utils` | 90 (measures 100) | 90 (100)   | 90 (100)   | 90 (100)   |
| `api`          | 80 (81.06)        | 63 (65.15) | 68 (70.73) | 80 (80.06) |
| `ui`           | 36 (38.47)        | 18 (19.91) | 34 (36.12) | 38 (40.2)  |
| `landing`      | 5 (5.58)          | 11 (12.4)  | 2 (2.34)   | 4 (4.91)   |

**Consequences:**

- `shared-utils` needed no lowering at all. Its only real gap was `stripHtmlTags`, untested despite being an XSS-adjacent helper; it now has a spec that also pins the documented limits of a structural-only strip (bare `<`, undecoded entities, malformed nesting). The lib sits at 100% on all four metrics.
- The two low rows are a debt statement, written down where it can be read. `ui` has 28 specs against 158 sources: the services, directives and interactive components are tested, the presentational primitives are not, and they are covered only through `/ddl` and e2e. `landing` outside `/ddl` is ~30 SSR page shells verified by e2e and the landing-copy contract spec.
- A threshold at 11% branches gates almost nothing, and that is the accurate reading. It stops slippage and nothing more. The number is a target to raise, and raising it is the work — not editing it downward when a build goes red.

---

### ADR-032: No Pixel-Diff Screenshot Baselines

**Status:** Accepted (2026-07-29)
**Context:** `console-e2e` carried two `toHaveScreenshot` tests, on `/` and `/categories`. They had never once gated anything. Playwright names a baseline `<name>-<project>-<platform>.png`, and the only two committed were `-win32`, so CI on `ubuntu-latest` looked for `-linux` and found nothing — and a developer on macOS produces `-darwin`, meaning **usable baselines could only ever be generated on CI, downloaded as an artifact, and committed by hand.** Task 386 rebuilt the spec (viewport before navigation, font/paint settling instead of a 1500ms sleep, a committed real admin password removed) and added a `workflow_dispatch` job to mint Linux baselines, so the mechanism was finished and ready to switch on. The question was whether to switch it on.

**Decision:** No pixel-diff baselines in this repo. The spec, its helper, the win32 PNGs, the `@visual` tag, the `--grep-invert @visual` gate and the baseline-regeneration workflow are all deleted.

The cost is asymmetric in the wrong direction:

1. **Coverage was two pages of roughly twenty**, so it protected two screenshots rather than the design system.
2. **Both pages had to be hollowed out to be diffable at all.** `/` masks its live DB counters and `/categories` is filtered to a no-match empty state, because row count changes page height and no mask fixes that. What is left to compare after masking and emptying is close to nothing.
3. **Maintenance lands exactly where the project is most active.** Console and landing are being redesigned continuously. Every intentional visual change turns the pair red, and clearing it means a CI round-trip — dispatch, download, review, commit — because the baseline cannot be regenerated on the machine doing the work.
4. **The same ground is already covered better.** `/ddl` is the declared source of truth for landing UI (see the DDL guardrail in `CLAUDE.md`), and design review runs on real screenshots read at the 4 breakpoints. `.context/design/contracts/responsive-contract.md` had already written down "no pixel-diff baselines"; the spec was the outlier, not this decision.

**Consequences:**

- `console-e2e` runs unfiltered again: `npx nx e2e console-e2e -- --shard=N/3`, with no tag to remember and no permanently-skipped tests pretending to assert something.
- `PW_CHANNEL=msedge` loses its one caveat. It existed for running the suite with no browser download, and the warning attached to it was only ever about baselines, so driving a system Edge is now unconditionally fine locally.
- **If visual regression is wanted later, point it at `/ddl`, not at data pages.** Its content is not DB-driven, so it needs no masking, and it is the surface whose drift actually matters. That was the reason the two data-page screenshots needed hollowing out in the first place.

---

### ADR-033: Chip Family ARIA — The Primitive Picks the Role, and the Doc Cites the Primitive

**Status:** Accepted (2026-07-29)
**Context:** All three members of the chip family shipped ARIA that described a structure the DOM never had. `chip-select` declared `role="radiogroup"`, `chip-toggle-group` declared `role="group"`, and `chip-boolean` rendered a lone `mat-chip-option` with no listbox parent; all three wrote `role` / `aria-checked` / `aria-pressed` onto `<mat-chip-option>` hosts. None of it took effect: `MatChipOption` hard-codes `role="option"` on the inner `<button>` that owns the accessible name and sets its own host to `role="presentation"`, so those were dead attributes rather than overrides. A Playwright ARIA snapshot of `/media` showed the result as `radiogroup` → two unnamed `option`s.

The cause is traceable. The component commit (`4312f03f`) and the design-bank commit (`c565819b`) are **39 seconds apart** on 2026-04-29, so the doc was retro-written in the same sitting rather than consulted first. Its A11y line came from the WAI-ARIA APG "Radio Group" pattern, which is the correct answer for a widget built from scratch, while its Implementation guide said to build on `mat-chip-listbox`. Those two lines cannot both be satisfied, and the code ended up taking the role from one and the child from the other. Material's own Chips page never mentions `radiogroup` at all: it prescribes `<mat-chip-listbox>` + `<mat-chip-option>` for "a set of user selectable options", and `multiple` when more than one may be chosen.

Two further gaps surfaced while checking the library docs. Material's Accessibility section says to label the **container** with `aria-label` / `aria-labelledby`, and not one of the four call sites did. And it says nothing at all about naming an individual chip, which is the half only source reading reveals: the name must be bound as `MatChipOption`'s `@Input('aria-label')`, because `[attr.aria-label]` stops at the skipped host.

**Decision:** Three rules for the family.

1. **When a component wraps a primitive, its A11y section cites the primitive's documentation, not the APG.** APG describes widgets built from nothing. Once you wrap, the roles are already decided, and the doc's job is to record them. Had this rule existed in April, `radiogroup` would never have been written down, because the first step is to open the Chips page and read it.

2. **Pick the primitive from the semantic, and accept that the family spans two of them.** The role you need is not negotiable by attribute; it is chosen when you choose what to wrap.

   | Member              | Semantic                 | Primitive                     | Container role / state                              |
   | ------------------- | ------------------------ | ----------------------------- | --------------------------------------------------- |
   | `chip-select`       | One-of-N, always set     | `mat-chip-listbox`            | `listbox` → `option`, `aria-selected`               |
   | `chip-toggle-group` | Many-of-N, empty allowed | `mat-chip-listbox [multiple]` | `listbox` → `option`, `aria-multiselectable="true"` |
   | `chip-boolean`      | Toggle button            | `mat-chip`                    | `role="button"` + `aria-pressed`, on the host       |

   `chip-boolean` is deliberately **not** a listbox member. A listbox of one option is invalid-feeling ARIA and the family already forbade it ("a 1-option multi is a checkbox"). `mat-chip` is the escape hatch Material documents for this: it implements no accessibility pattern, has no inner button, and reflects `attr.role` and `attr.aria-label` from inputs — the exact inverse of `mat-chip-option`, so here ARIA written on the host is correct rather than dead. `mat-button-toggle-group multiple` would also have produced `group` → `button` + `aria-pressed`, but it renders a connected segmented control, which is `console-segmented-control`'s job.

3. **The group's accessible name is a required input, not an optional one.** `aria-label` on `chip-select` and `chip-toggle-group` is `input.required`, so a nameless group cannot ship. It binds as `[attr.aria-label]` because the listbox host is itself the node carrying `role="listbox"` and neither `MatChipSet` nor `MatChipListbox` declares an input for it. That is the opposite of the chips inside it, and the asymmetry is written into both templates.

**Consequences:**

- `chip-toggle-group`'s doc changed from `aria-pressed` to `aria-selected` rather than the code bending to the doc. A multi-select listbox announces the set context that a bag of independent toggle buttons cannot, and the port also delivered the roving tabindex and arrow keys that the doc's own checklist had been asking for since April while the hand-rolled `<div>` provided neither.
- **`hideSingleSelectionIndicator` is gone from `chip-select`.** It had sat on `mat-chip-option`, where it is not an input, so it was inert and the checkmark had been rendering all along; carrying it up to the listbox during the rewrite would have silently removed it. Material warns the flag "makes the component less accessible", and `_overview.md` uses the check affordance as the very thing separating `chip-select` from `console-segmented-control`.
- `mat-chip` never receives `.mdc-evolution-chip--selected`, which is where Material keys the filled background, and `[highlighted]` only recolours the hover/focus overlay and trailing icon. `chip-boolean`'s pressed fill is therefore set in SCSS from Material's own chip tokens, keyed off `[aria-pressed='true']` so the visual state cannot drift from the announced one.
- Both siblings had **no spec file at all**; they now have 25 tests between them, written red first. The load-bearing one asserts that exactly one node in `chip-boolean` carries a `role` and that it is the host, because sliding back to a chip-option is the single most likely future regression and it would turn nothing else red.
- Four call sites gained an `aria-label`, and no call site needed any other change: both components kept their public API.

---

### ADR-034: Storage Is an Adapter Chosen at Runtime, and Media URLs Are Never Provider-Shaped

**Status:** Accepted (2026-07-29)
**Context:** `MediaModule` bound `STORAGE_SERVICE` to `CloudinaryStorageService` with `useClass`, and that adapter deliberately boots without credentials so the API starts anywhere. The result was an app that came up healthy and failed every write: on CI, all three e2e shards logged `Cloudinary upload failed: Must supply api_key` and 41 tests went red across eight spec files. The failure never named storage — the specs reported `AxiosError: Request failed with status code 500`, a 30s `beforeEach` timeout, or `element(s) not found` on an empty picker grid, which is three different-looking symptoms for one missing environment variable. The whole media picker surface was untestable on any machine without secrets, and every CI run that _did_ have them would write throwaway assets into a real Cloudinary account.

**Decision:** Three rules.

1. **A missing integration selects a different adapter; it does not degrade the one you have.** `createStorageService` picks `CloudinaryStorageService` when all three `CLOUDINARY_*` vars are present and `LocalStorageService` otherwise. The choice lives in a `useFactory`, not a conditional `useClass`, so the environment is read when the module is instantiated — after `main.ts` runs `dotenv.config()` — rather than when the decorator is evaluated at import time. Nest calls `onModuleInit` on factory-produced providers, so the Cloudinary adapter still configures itself exactly as before. A partially set environment reads as unconfigured: half a credential set is the case that used to fail every upload instead of falling back.

2. **A fallback is scoped by environment, not by whether the real thing happens to be configured.** The local adapter is a development and CI facility, so production never selects it: with `NODE_ENV=production` and no credentials the factory throws and the app refuses to boot, the same posture as `CORS_ORIGINS` in `main.ts`. Keying only on `isCloudinaryConfigured()` would have meant a rotated or missing secret silently switching a deployed instance to ephemeral disk and writing `http://localhost:3000/...` into the production database — a quieter and far worse failure than the one this ADR set out to fix.

3. **No code may recognise an asset by its provider's hostname.** "This URL came from our media library" is the real question, and it has to stay true when the library is local disk. `MEDIA_ASSET_URL_MARKERS` answers it for both backends.

**Consequences:**

- `LocalStorageService` is not a Cloudinary substitute and says so. `generateUrl` ignores `transforms` because there is no local transformation engine, so the console renders full-size images where it would otherwise get thumbnails. That degrades correctly for free: `CloudinaryThumbPipe` passes a non-Cloudinary URL through and `CloudinaryPdfThumbPipe` returns `''` so the caller falls back to an icon. It also means the public route is `/api/media-files/`, never `/api/uploads/` — those pipes splice transforms in after the literal `/upload/` segment, and a URL containing it would be rewritten into a 404.
- **Files are served by an unguarded controller, and that is the same posture as Cloudinary.** These URLs land in `<img src>` and `<a href>`, which never carry a bearer token, so the sibling `MediaController`'s `JwtAccessGuard` + `ADMIN` cannot apply. The library _listing_ stays admin-only; individual assets are public either way. `MediaFileController` 404s whenever Cloudinary is active **or** `NODE_ENV` is production — two independent checks, so the route stays dead on a deployed instance even if rule 2 is ever loosened — and every path goes through `resolveWithinRoot`, which rejects anything resolving outside the storage directory _or to the directory itself_ (`''` and `'.'` would otherwise aim `delete()` at the whole tree).
- **Serving user bytes from our own origin is a new hazard that Cloudinary's third-party host never posed, and the filename is not to be trusted.** `detectMimeType` returns `text/plain` and `text/markdown` unverified because neither has magic bytes, so `poc.html` declared as `text/plain` clears the scanner with its extension intact — and `sendFile` would then serve it as `text/html` on the origin holding the auth cookies, with `.svg` and `.js` worse still. Storage adapters therefore name files from the **validated MIME type** via `MIME_TYPE_EXTENSIONS`, falling back to `bin` so an unmapped type cannot inherit an executable extension. The response additionally carries `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; sandbox`.
- **helmet's defaults had to be overridden per-response.** It sets `Cross-Origin-Resource-Policy: same-origin`, which silently stops the console on `:4300` from rendering an image served by the API on `:3000`; the route sets `cross-origin` explicitly. For the same reason `http://localhost:3000` joined `img-src` in the console CSP, mirroring the `connect-src` entry that was already there. Cloudinary never hit either problem because it is a third origin already covered by `https:`.
- **A real product defect surfaced, not just a test one.** `inferCertMode` decided a certificate's Link/File mode by testing the URL for `res.cloudinary.com`, so a locally stored certificate reloaded as a Link. Mode is deliberately never persisted and re-derived from the URL on load, so the fix belonged in the predicate, not in the payload.
- The e2e suite stopped asserting on the provider. `MEDIA_ASSET_URL` in `data/test-media.ts` matches either backend; the five `expect(href).toContain('cloudinary.com')` assertions had made the specs unrunnable without secrets while proving nothing the weaker claim does not.
- **A database that has run on the local adapter is a throwaway one.** `Media.url` keeps the absolute URL it was written with, consumer columns copy it, and configuring Cloudinary later rewrites nothing. `publicId` shapes also differ between backends, so a cross-backend `delete` is a silent no-op that orphans the remote asset. Rule 2 confines all of this to development and CI, which is the only reason persisting an absolute URL is acceptable at all.
- The factory is the linchpin, so it is the piece that got tests rather than the piece that got a comment: `storage.factory.spec.ts` pins both selections, each single-missing-credential case, and the production refusal. Extracting it out of the module decorator is what made that possible.

### ADR-035: The Console Favicon Is the Same Mark Unboxed, and Its Ink Is the Browser's Decision

**Status:** Accepted (2026-08-02)
**Context:** Console still shipped Angular's default favicon while landing shipped the Brand Monogram, so the two tabs shared no identity at all. The obvious fix — give console the same icon — collapses into the opposite problem: two tabs that cannot be told apart. Six solid-surface treatments were rendered and rejected on looks. The chosen direction, a transparent `tdp.`, then hit the constraint that makes transparency non-trivial: a transparent icon has no background of its own, it borrows the browser's tab strip, and that strip flips with the user's theme. Measured against Chrome's two strips (`#dee1e6` / `#202124`), the near-white ink scores 1.08 contrast on light and the near-black scores 1.21 on dark — both invisible, not merely faint.

**Decision:** Three rules.

1. **Landing is boxed, console is not, and that contrast is the whole distinction.** No second accent, no altered Dot, no shortened mark. The Monogram is identical in both; only the surface differs. A hollow-ring Dot was considered as an alternative differentiator and rejected on measurement — at 16px the Dot is roughly 2px, and a ring collapses into a smudge.

2. **The primary console asset carries both inks and lets the browser choose.** `adaptiveMonogramSvg()` emits an SVG whose own `<style>` holds a `prefers-color-scheme` query, so the browser painting the tab resolves the ink and the icon flips live with no reload. The `.ico` fallback cannot run that query, so it uses the accent monotone — the only fixed ink that clears both strips (3.51 / 3.50), and only just. In `index.html` the `.ico` link is deliberately **first** so SVG-capable browsers override it.

3. **Landing keeps its solid surface because its manifest says so.** `manifest.webmanifest` declares 192/512 launcher icons and the head declares a 180px `apple-touch-icon`; both slots get composited onto a surface the OS controls, where alpha flattens. Porting transparency would have left landing transparent in the tab and solid on the home screen — a split identity worse than either. Console has no manifest, so it has no such constraint, and it deliberately ships **no** `apple-touch-icon` rather than reintroducing a solid variant for one slot nobody uses.

**Consequences:**

- The portable half of this — the contrast trap, the adaptive-SVG recipe, the slots where transparency is forbidden, and the icon-geometry formula — lives in the global design library as `patterns/theme-adaptive-icon`. This ADR holds only what is specific to these two apps.
- **Two padding knobs multiply, and that is why the mark used to read small.** Stage 1 bakes 10 units of clearspace into `MONOGRAM_VIEWBOX`; `buildFavicons` was adding 8 more on top and then fitting to 88% of the square, which put the ink at ~41% of the icon's height. Landing now renders at `padding: -6` and 0.90 (~47%, about 15% more ink) and console, having no box edge to keep clear of, at 0.98. The mark itself is unchanged — the gain is entirely in the two knobs.
- **`tdp.` cannot get much bigger than this.** At 1.84 : 1 it can only ever be about half the height of a square. Single-glyph marks (`d.`, `p.`) were rendered and measured at 78% and were markedly crisper at 16px, but a one-letter monogram is a different mark, not a tuning of this one.
- The generator gained a `console-favicons` target with its own output directory, so one Stage-2 run serves both apps. Stage 1 was not touched: the mark did not change, so the glyph data did not either.
- `apps/console/public/favicon.ico` — previously Angular's default, byte-identical to the stale copy still sitting in landing's public root — now holds the brand `.ico`, so an implicit `/favicon.ico` request resolves correctly even though both apps declare their icons explicitly.
- **The living reference renders the shipped file, not a copy of it.** `/ddl/favicon` loads `/brand/favicon.svg` itself and shows both states by wrapping it in `color-scheme: light` / `color-scheme: dark` — an `<img>`-loaded SVG follows the wrapper's colour-scheme, while an inlined one does not. The page therefore cannot drift from what ships and adds no image assets to `public/`. The 21 candidate PNGs used during exploration were deleted, not kept.
