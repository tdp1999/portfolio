# Epic — DDL → Component Docs (3-column)

**Status:** Phase 0 ✅ · Phase 1 ✅ (shell + sidebar + TOC + Cmd+K) · Phase 2 ✅ (all 12 inline sections split into ~20 per-primitive doc pages; auto-derive multi-level TOC; index gutted). Phase 3 ✅ (all 24 exploration pages migrated to `DdlDocPage` + decision convention; app-shell scroll model) · Phase 4 ✅ (responsive QA 4 BP, deprecated hidden, console clean).
**Owner:** Phuong
**Goal:** Refactor `/ddl` from a single 1654-line scroll page + 25 ad-hoc subroutes into a proper component-docs site (shadcn / Tailwind / Polaris class), with a 3-column shell, a scope-based taxonomy, and a **standardized decision convention** that makes "which variant won" scannable everywhere.

---

## 1. Decisions locked (from drill)

| # | Decision | Choice |
|---|---|---|
| 1 | What is `/ddl`? | **Hybrid** — a clean **Reference** + a **Lab**, clearly separated, but in one sidebar (separation is via *status*, not a separate area). |
| 2 | Sidebar taxonomy | **Foundations / Components / Sections / Pages / Patterns** (a scope ladder + Patterns as the orthogonal guidance axis). |
| 3 | Page architecture | **Split each entry into its own route** (one component = one page, shadcn model). |
| 4 | Canonical vs draft | **Standardized marking** — a per-page lifecycle status + a per-variant "Selected" marker, all data-driven. This is the headline of the epic. |
| 5 | Lab ↔ Reference relationship | **One page, collapse "Considered"** — the selected variant becomes the page's main Showcase; losers collapse under a "Considered / Decision record" disclosure. Status badge flips. No content duplication. |
| 6 | Preview surface | **`landing-segmented` tabs = Showcase / Usage** (Prototypes tab dropped — folds into Showcase + Considered) + **Copy code**. (Theme toggle dropped — see Phase 2a.) |
| 7 | This deliverable | This spec, to approve before any implementation. |

### 1a. Refinements (drill round 2)

| Topic | Choice |
|---|---|
| Reference/Lab surfacing | **Filter over one tree** — single sidebar, 5 groups, a top filter `All / Reference (shipped) / Lab (exploring+decided)`. Not two separate trees/tabs. |
| Primitive granularity | **One page per primitive** — `button`, `link`, `arrow`, `chip`, `eyebrow`, `status-dot`… each its own route (~50 pages). No family-per-page. |
| Prototypes tab | **Dropped** — page tabs become **Showcase / Usage**; prototype content folds into Showcase + the Considered disclosure. |
| Foundations vs Patterns cut | **Confirmed** — `contrast`/`prose-flow` → Foundations; `backgrounds`/`interactions`/`fragment-nav` → Patterns. |

---

## 2. The decision convention (headline)

The single most important artifact. Replaces the five inconsistent prose phrasings with one data-driven format.

### 2a. Per-page lifecycle status

Every doc entry carries exactly one status. It drives a **sidebar badge** and a **page-header chip**, and it *is* the Reference/Lab separator.

| `status` | Meaning | Sidebar cue | Belongs to |
|---|---|---|---|
| `shipped` | Live in production = canonical | solid label, no badge | **Reference** |
| `decided` | A variant chosen, not yet built/shipped | accent dot · "Decided" | **Lab** (graduating) |
| `exploring` | Variants on the table, no decision | muted dot · "Exploring" | **Lab** |
| `deprecated` | Superseded / historical | grey, strikethrough · "Deprecated" | hidden by default |

"Reference vs Lab" is a *filter over status*, not a separate tree: a sidebar toggle (or a top filter) flips between **All / Reference (shipped) / Lab (exploring + decided)**. A page graduates Lab→Reference simply by flipping `exploring`→`decided`→`shipped`.

### 2b. Per-variant "Selected" marker

Inside an exploration page that shows N directions:

- The winning variant gets a **`✓ Selected`** chip + accent ring, and a one-line **decision note** ("why this won").
- Losing variants get a quiet **"Considered"** (or "Rejected") label and **collapse** under a `Considered / Decision record` disclosure (per Decision #5).
- For a `shipped` page, the selected variant is the default-open Showcase; the disclosure is closed by default.

This is the same widget on every page — no more hunting prose for "picked".

### 2c. Schema (extends `ddl.types.ts`)

```ts
export type DdlStatus = 'shipped' | 'decided' | 'exploring' | 'deprecated';
export type DdlGroupId = 'foundations' | 'components' | 'sections' | 'pages' | 'patterns';

// One registry entry per doc page (replaces the flat DDL_SUBROUTES + DDL_SECTIONS split)
export type DdlEntry = {
  readonly slug: string;     // route segment: 'button', 'hero', 'blog-detail'
  readonly title: string;
  readonly group: DdlGroupId;
  readonly status: DdlStatus;
  readonly summary: string;  // one line for sidebar tooltip + page header
};

// One per variant inside an exploration page
export type DdlVariant = {
  readonly id: string;       // 'alpha' | 'v2' | 'B'
  readonly label: string;
  readonly selected?: boolean;
  readonly decision?: string;          // one-line rationale, only on the selected one
  readonly state?: 'considered' | 'rejected';
};
```

A single `DDL_REGISTRY: DdlEntry[]` becomes the source of truth for the sidebar, the badges, and the Reference/Lab filter.

---

## 3. The 3-column shell

| Column | Width | Sticky | Contents | Drops at |
|---|---|---|---|---|
| **Left rail** | ~256px | sticky, own scroll | Grouped, collapsible nav (the 5 groups) + status badges + Reference/Lab filter | → drawer below **laptop** |
| **Center** | fluid, text capped ~`--landing` measure | normal scroll | The doc page (see §5) | always |
| **Right TOC** | ~220px | sticky | "On this page" — the current page's H2/H3, scrollspy | hide below **laptop**, convert to inline `<details>` |

- **Top bar** (constant): title, **Cmd+K** finder, light/dark toggle, Reference/Lab filter.
- **Cmd+K**: wire the already-explored `/ddl/command-palette` as the real finder over `DDL_REGISTRY` (Pages · Components · Sections grouped). This is what lets the sidebar stay grouped-but-simple while search carries discovery.
- **Responsive**: all device-bound per the locked 4-BP contract (`respond-to`/`respond-down`, `currentBp()`); no raw `@media`. Left rail uses the same off-canvas pattern as the explored `/ddl/mobile-nav`.
- **Landing-scoped**: built from `landing-*` primitives + landing typography scale only (per CLAUDE.md). The shell itself (sidebar, TOC, preview frame) becomes a small set of new `landing-*` doc components, reusable and documented on `/ddl` itself.

---

## 4. Taxonomy mapping (every current entry → group + proposed status)

Statuses are **proposed** from the embedded prose — flagged ones in §7 need your confirm. Inline sections (the 12 in `DDL_SECTIONS`) all become individual `shipped` routes.

### Foundations
| Slug | From | Status |
|---|---|---|
| container | inline `#container` | shipped |
| tokens (color · spacing) | inline `#tokens` | shipped |
| typography | inline `#typography` | shipped |
| contrast | `/ddl/contrast` | shipped |
| prose-flow | `/ddl/prose-flow` | shipped |
| identity (brand) | `/ddl/identity` | shipped |

### Components
| Slug | From | Status |
|---|---|---|
| button · link · arrow | inline `#primitives` → **3 pages** | shipped |
| chip · eyebrow · status-dot | inline `#labels` → **3 pages** | shipped |
| figure · pull-quote · section-rule | inline `#content` → **3 pages** | shipped |
| segmented | inline `#segmented` | shipped |
| icon / input | inline `#icon-input` | shipped |
| back-link / empty-state | inline `#utilities` | shipped |
| loading-spinner / router-progress | inline `#loading` | shipped |
| section-heading | inline `#headings` | shipped |
| section-header | `/ddl/section-header` | decided |
| page-hero | `/ddl/page-hero` | shipped |
| carousel | `/ddl/carousel` | shipped |
| lightbox | `/ddl/lightbox` | shipped |
| show-more | `/ddl/show-more` | shipped |
| scroll-edge-fade | `/ddl/scroll-edge-fade` | shipped |
| form-lib | `/ddl/form-lib` | shipped |
| form-input | `/ddl/form-input` | deprecated |
| language-switcher | `/ddl/language-switcher` | exploring |
| command-palette | `/ddl/command-palette` | exploring |
| mega-menu | `/ddl/mega-menu` | exploring |
| mobile-nav | `/ddl/mobile-nav` | exploring |
| feed-filter-bar | `/ddl/feed-filter-bar` | exploring |

### Sections
| Slug | From | Status |
|---|---|---|
| hero | `/ddl/hero-variants` | decided (α picked) |
| bio | `/ddl/bio-improvements` | decided (picks flagged) |
| selected-work | `/ddl/selected-work-transitions` | exploring |
| stack | `/ddl/stack` | exploring |
| story | `/ddl/story-variants` | exploring |
| philosophy-strip | `/ddl/philosophy-strip` | exploring |
| get-in-touch | `/ddl/get-in-touch` | decided (G shipped to home) |
| feed-item | `/ddl/feed-item-variants` | exploring |
| uses-card | `/ddl/uses-card-variants` | shipped (V2+S1 graduated) |

### Pages
| Slug | From | Status |
|---|---|---|
| page-shell | `/ddl/page-shell` | shipped |
| project-detail | `/ddl/project-detail-explore` | exploring |
| blog-list | `/ddl/blog-list-variants` | exploring |
| blog-detail | `/ddl/blog-detail-variants` | exploring |
| about-signatures | `/ddl/about-signatures` | exploring |

### Patterns
| Slug | From | Status |
|---|---|---|
| backgrounds | `/ddl/backgrounds` | shipped |
| fragment-navigation | `/ddl/fragment-navigation` | exploring |
| interactions | `/ddl/interactions` | exploring |
| feed-pagination | `/ddl/feed-pagination` | exploring |
| email-templates | `/ddl/email-templates` | exploring |

---

## 5. Per-page doc anatomy

Design-first (your own reference lab), top-to-bottom:

1. **Header** — title · status chip · one-line summary · prev/next pager.
2. **Preview surface** — framed canvas + `landing-segmented` tabs (**Showcase / Usage**). Toolbar: **Copy code**, **light/dark toggle**. (Query-param tab state preserved, as today.) Prototype experiments fold into Showcase + the Considered disclosure — no separate Prototypes tab.
3. **Variants / Considered** — for Lab pages: selected variant open; `Considered / Decision record` disclosure below (§2b).
4. **Usage** — minimal import + snippet (the existing "Usage" tab content).
5. **Notes** — a11y / responsive / gotchas, where they exist.

---

## 6. Migration plan (phased — each phase is independently shippable)

- **Phase 0 — Registry. ✅ DONE.** Added `DdlStatus/DdlGroupId/DdlEntry/DdlGroup/DdlVariant` to `ddl.types.ts`; built `DDL_GROUPS` (5) + `DDL_REGISTRY` (55 entries) in `ddl.registry.ts`, each with `source` migration pointer. No visual change; `tsc` clean.
- **Phase 1 — Shell.**
  - **1a ✅ DONE.** `DdlShell` (topbar + sticky 264px sidebar + `<router-outlet>`) wired at route level (`path: 'ddl'` → `loadComponent`, children unchanged) so the sidebar is persistent across all `/ddl/*` pages. `DdlSidebar` is registry-driven: 5 groups, collapsible, status badges (decided/exploring/deprecated), Reference/Lab/All filter, active highlight. Links resolve from each entry's `source` (route entries → live route; inline entries → index anchor). Responsive: below `laptop` the sidebar becomes an off-canvas drawer (hamburger + backdrop). `nx build landing` clean. **Needs dev-server restart to view (new route/chunk).**
  - **Layout revisions (user feedback):** topbar removed — brand + Reference/Lab filter moved into the **sidebar footer** (filter ownership moved into `DdlSidebar`); mobile drawer toggle is now a floating button. Group-header alignment fixed (line-height:1 + triangle caret).
  - **1b TOC ✅.** Right rail now uses the **canonical `landing-toc-sidebar`** (same as blog/project detail), not the floating minimap. Mechanism: `DdlDocsService` (provided by shell) lets a child page `publish()` its `InPageSection[]`; shell feeds them to a shared `LandingScrollspyService` + renders the TOC; TOC auto-clears on navigation. Index page publishes `DDL_SECTIONS` and its `FloatingPillNav` minimap was removed. Child pages without published sections → right rail hidden (they'll publish as they convert in Phase 3).
  - **TOC bug fixes (user feedback):** (1) right rail wasn't sticky — body was `align-items: flex-start`, so the TOC column had no height to stick within → changed to `stretch`. (2) Clicking a TOC link wiped the TOC — `NavigationStart → clear()` fired on fragment-only nav too; now clears only when the route **path** changes (`url.split('#')[0]` compare).
  - **1b Cmd+K ✅.** Built a real palette (`DdlCommand` + `DdlSearchService`, provided by shell): `⌘/Ctrl+K` toggles, fuzzy search over `DDL_REGISTRY` (title/slug/group/summary), ↑/↓ + Enter to navigate (via shared `entryLink`/`entryFragment` helpers), Esc/backdrop to close. Sidebar has a "Search… ⌘K" trigger. NB: this is a fresh shipped finder — the `/ddl/command-palette` exploration page stays as design reference, not reused.
  - **Known caveat to QA (Phase 4):** child pages sit in a `flex:1` column between the 264px sidebar and 240px TOC — wide/full-bleed exploration pages may need width tuning.
- **Phase 2 — Split Reference.** Break the 12 inline sections into per-route Foundations/Components doc pages using the standardized preview surface (§5). The big mechanical migration.
  - **2a ✅ Doc-scaffold + first page.** Built the reusable doc-page scaffold (all app-local in `pages/ddl/`): `DdlStatusChip` (`landing-ddl-status-chip` — the one standardized lifecycle marker, used by header & future records), `DdlDocPage` (`landing-ddl-doc-page` — registry-driven header `group · title · status · summary` + projected body + prev/next pager, neighbours from `DDL_REGISTRY` order), `DdlPreview` (`landing-ddl-preview` — framed canvas, `landing-segmented` Showcase/Usage tabs via `[ddlShowcase]`/`[ddlUsage]` projection, both panes kept in DOM + toggled by `[hidden]`, Copy-code button). **Theme toggle:** dropped per user — no theme toggle on the docs (landing tokens are `html[data-theme]`-scoped so a per-canvas toggle would need a token refactor anyway). Migrated **Button** as the proof page (`/ddl/button`, `DdlButton`); registry `source` flipped `inline:#primitives` → `route:/ddl/button` so the sidebar links to it. `nx build landing` clean. Inline `#primitives` section left intact for now (link/arrow still anchor to it until their pages exist). **Needs dev-server restart (new route/chunk).**
  - **2a-rev (review feedback) ✅.** Reworked the scaffold per review: (1) **Tabs → headers** — dropped the `DdlPreview` Showcase/Usage segmented tabs; each is now its own stacked `landing-ddl-section` (anchored `<h2>` + projected body; `framed` wraps a preview canvas, Copy-code lives on the framed section head). (2) **TOC always on** — each page declares its in-page `sections` to `DdlDocPage`, which publishes them; shell shows the right rail whenever a page has **≥2** sections (`showToc = sections().length > 1`), hides it for single-section pages. (3) **Footer in content** — the global `landing-shell` footer was bleeding full-width below the docs sidebar; made `Shell` route-aware (`isDocs = url startsWith /ddl`) to suppress its footer-banner/signature on `/ddl`, and re-rendered them **inside** `DdlShell`'s `__main` column (DdlShell now fetches profile like `App`). Header + global command palette stay. (4) **Cmd+K unified** — deleted the DDL-local `DdlCommand`/`DdlSearchService`; the sidebar Search trigger now opens the shell's `CommandPaletteService` (the one ⌘K). (5) **Sidebar cleanup** — removed per-entry status badges (status now lives only on the page-header chip inside content) and the brand footrow (footer = just the Reference/Lab filter). (6) **Width** — content centered, max-width **768px** (user pick). `nx build landing` clean.
  - **2b ✅ batched the rest.** Split all remaining inline sections into per-route pages (link, arrow, chip, eyebrow, status-dot, figure, pull-quote, section-rule, segmented, icon, input, back-link, empty-state, loading-spinner, router-progress, section-heading) + the Foundations trio (container, tokens, typography). Each = folder-per-component (`ddl-<slug>/ddl-<slug>.ts` + `.html`, class `Ddl<Pascal>`, selector `landing-ddl-<slug>`), built on the §5 scaffold (`DdlDocPage` + `DdlSection`). Arrow/chip/status-dot copied their prototype effect SCSS (`.arrow-fx-test`/`.interaction-fx-test`) into component-scoped `.scss`. Every `source` in `DDL_REGISTRY` flipped `inline:#x` → `route:/ddl/<slug>`.
  - **2b-rev (6 user-feedback structural fixes) ✅.** (1) **Routes extracted** — `ddl.routes.ts` (`DDL_ROUTES`) holds all children; `app.routes.ts` now `loadChildren: () => import('./pages/ddl/ddl.routes')` (shell `loadComponent` retained) so app.routes stays quiet. (2) **Sidebar simplified** — dropped the All/Reference/Lab filter and the duplicate Cmd+K trigger; sidebar is now just collapsible nav groups. (3) **Auto-derive multi-level TOC** — `DdlDocPage` scans its rendered DOM (`section.ddl-section[id], h3[id], h4[id]`) in `afterNextRender`, builds nested `InPageSection[]` (section→L2, h3→L3, h4→L4; `data-toc` attr overrides the displayed title) and publishes to `DdlDocsService`; the manual `sections` input is kept only as the SSR/no-JS fallback. Authors get a nested TOC just by writing `<h3 id="…" data-toc="Short">` — no `.ts` edits. (4) **Viewport-centering layout** — `DdlShell` body is one viewport-wide grid `[sidebar 264px] [1fr] [content 768px] [1fr] [toc 264px]`; content is centered in the **viewport** because the two `1fr` gutters are equal IFF `sidebar-w == toc-w` (both 264px). The TOC column is always reserved (even when a page has no TOC) to preserve centering; the footer spans `grid-column: 2 / 6` (everything right of the sidebar). (5) **Scroll-logo hidden on docs** — `header.ts` gained `isDocs = url startsWith '/ddl'`; the scrolled-state pinned-left logo is `@if (!isDocs())` so it no longer overlaps the sidebar. (6) **DDL pages in ⌘K (search-only)** — added `COMMAND_PALETTE_SEARCH_SOURCES` InjectionToken (lib) + app-provided `DDL_COMMAND_RESULTS` (maps `DDL_REGISTRY` → `kind:'doc'`); `command-palette.ts` folds them in **only when the query is non-empty**, so DDL pages are searchable but don't clutter the default palette. Lib never imports app (token indirection).
  - **2b sweep + index gut ✅.** Added ~27 sub-headings (`<h3/h4 id data-toc>`) across the 12 multi-demo pages so the auto-derived TOC actually nests (figure 7 · segmented 3+3 · section-heading 5 · chip/status-dot 2-tier protos · button/link/arrow/section-rule/empty-state 2–4 each; single-demo pages left flat → TOC auto-hidden). Gutted the index: `ddl.html` = header + `#prototypes` nav only (removed 12 inline showcases + stale banner); `ddl.ts` lean (`imports: [RouterLink, Container]`, publishes the 1-entry `DDL_SECTIONS`); `ddl.data.ts` `DDL_SECTIONS` trimmed to `[{ id: 'prototypes', … }]`; `ddl.scss` reduced to `.ddl-nav` (dead fx blocks moved to component scss). `nx build landing` clean; user reviewed visually.
- **Phase 3 — Regroup + convention.** Re-home the 25 subroutes into Sections/Pages/Patterns; apply the `selected`/`considered` widget; replace every prose "picked/shipped/graduated" with structured `status` + variant markers.
  - **3a ✅ Decision widgets + width variants + canonicalize proof (uses-card).** Built the two standardized decision components (app-local): **`DdlDecisionRecord`** (`landing-ddl-decision-record` — data-driven from `DdlVariant[]`: an accent-framed verdict block = ✓ Selected variant + one-line decision, then the considered/rejected ones with their trade-offs; the §2b headline marker, one shape everywhere) and **`DdlConsidered`** (`landing-ddl-considered` — a `<details>` closed by default that collapses the loser-variant *visuals* beneath the winning showcase). Extended `DdlVariant` with `note?` (per-considered trade-off). **Width variants:** `DdlDocPage` gained `width: 'prose' | 'wide' | 'full'` (default prose) published via `DdlDocsService.setWidth()`; the shell sizes the content column off it — `--ddl-content-w` 768→1120 for `wide`, and `full` spans `grid-column: 2/6` (reclaims the TOC column, TOC forced off) on laptop+ only. `.ddl-doc` dropped its own 768 cap so the shell column is the single width source. So full-bleed pages (hero/carousel/lightbox/blog-detail/backgrounds) opt into room instead of being crushed into 768. **Canonicalize decision:** chose a *hard switch* to the canonical slug (no redirect/alias) — these are internal docs, every link is ours and updated in lockstep; the old path simply 404s. Proof page **`uses-card`** (renamed via `git mv` from `uses-card-variants`: folder + 5 files + class `DdlUsesCard` + selector): wrapped in `DdlDocPage` (auto header chip + TOC + pager), decision-record at top, V2 (winner) as the open showcase, V1/V3 inside the `DdlConsidered` disclosure, prose "Picked:" replaced by `USES_CARD_VARIANTS` data. Registry `source` + index nav path updated. `nx build landing` clean (prerender unaffected). **Opt-in for the batch:** `<landing-ddl-doc-page slug="…" [width]="'wide'|'full'">` + a `*_VARIANTS: DdlVariant[]` per page.
  - **3b ✅ batched the rest.** Migrated all remaining exploration pages by group (Foundations / Components / Sections / Pages / Patterns) via 16 parallel agents on a shared spec — each = canonical-slug rename + `DdlDocPage` wrap (+ `width` where full-bleed) + decision-record/considered + prose→`DdlVariant` data + registry `source` update. Per-page status verified against §7. Plus the **app-shell scroll model** (window-locked at laptop+, internal content scroller, fixed full top-bar; see [[ddl-docs-scroll-model]] memory) and the standardized `landing-ddl-stage` "⤢ Full width" fidelity primitive.
- **Phase 4 — Polish ✅.** Responsive QA across 4 BPs (per `responsive-system`), deprecated-hiding, prev/next pagers, taste pass.
  - **4a ✅ Mobile chrome + scroll model.** Mobile/tablet QA fixes (all in [[ddl-docs-scroll-model]]): docs-nav toggle → bare panel-left icon (was bordered hamburger), brand logo nudged clear (`pl-12`) not hidden; header turns opaque on scroll (`.header-solid` via `docsBarSolid`); toggle hides under overlays (`body.overlay-open` + `:host-context`, since the header's `sticky z-50` stacking context traps z-index) and under its own drawer; `documentElement.overscrollBehaviorY:none` kills the at-top rubber-band desync between sticky header and fixed toggle.
  - **4b ✅ Desktop layout + width.** **TOC dropped at laptop, returns at wide** (user decision): sidebar+TOC = 528px squeezed content below prose on smaller laptops (496px @1024). Now laptop (1024–1439) = `1fr content 1fr` (no TOC) → content 760@1024 / 1016@1280; wide (1440+) adds the TOC column back. **Window-lock bug fixed:** `.ddl-shell__scroll` was `position:static`, so `landing-carousel`'s absolute fade-arrows escaped the `overflow:auto` clip to the ICB and grew the document (window scrolled on carousel pages) — added `position:relative` to make the scroller their containing block.
  - **4c ✅ Deprecated hidden + dead code.** Sidebar filters `status==='deprecated'` (Components 30→29; `form-input` reachable only by URL, still shows its chip); pager `prev/next` skip deprecated. Removed dead `DDL_SECTIONS`/`DDL_SUBROUTES` + `DdlSubroute*` types from `ddl.data.ts`/`ddl.types.ts`.
  - **4d ✅ Console clean.** Backdrop `aria-hidden="true"` (focusable button → AT warning) → `aria-label`. Swept NG0955 (duplicate track keys) across all 56 routes — none in current code (was a stale dev-server chunk artifact; clears on restart, which is required anyway for the new routes/chunks).

---

## 7. Open questions

**Resolved (round 2):** Reference/Lab = filter over one tree · one page per primitive (~50 pages) · Prototypes tab dropped · Foundations/Patterns cut confirmed. See §1a.

**Still open:**
1. **Status accuracy** — §4 statuses are inferred from prose; to verify per-page when building. Most likely correction: `get-in-touch` may be `shipped` (not `decided`) since variant G already shipped to home. Confirm at Phase 0, or page-by-page during Phase 3.
