# Epic E5: Implementation

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: broken-down (2026-05-02). 29 tasks created (274–302) in `.context/tasks/`.
> Depends on: E2 (content), E4 (direction).
> Feeds: E6 (QA/polish/a11y/SEO).

## Purpose

Build the portfolio site end-to-end against the content authored in E2 and the direction settled in E4. By the end of E5, every page in V1 scope renders with real content, the visual signature is intact, and the site is ready for E6 polish.

## Scope summary

- 1 home page (9 sections, copy from E2).
- 5 sub-pages: `/projects` index (B3.c), `/projects/<slug>` detail (D3.c), `/uses`, `/colophon`, plus `/404`.
- 3 V1 projects authored end-to-end with case-study depth (Console MVP, plus 2 others) — content authoring folded in from descoped E3.
- All schema migrations queued from E0 / E2 / E4.
- Theme toggle (dark-first with light parity).
- Angular SSR; Lighthouse perf gate enforced per page during build (final score work belongs to E6, but no page lands here below 80 baseline).

## Out of scope (handled elsewhere)

- A11y audit, SEO meta polish, OG image, JSON-LD, sitemap submission → **E6**.
- Promotion / launch checklist → **E7**.
- Vietnamese translations → parking lot.
- Blog route — D3.a / D3.b parked there if it ships V2.

## Direction inputs (from E4)

Pulled here as one-glance context. Source of truth lives in `epic-portfolio-e4-uiux-direction.md` and the design bank.

- Identity: technical + quiet. Dark-first with toggle.
- Palette: technical-cool, deep ink background (#0a0d12 range), single indigo-violet accent ~#6E66D9 used sparingly.
- Type pair: Newsreader (serif italic for emphasis) + Inter (sans body) + JetBrains Mono (mono labels/eyebrows).
- Density: medium. 4px grid. 1px hairline borders only (2px reserved for active state). 4px corner radius (pill for status badges only).
- Motion: considered (hover/focus/tab-switch/theme toggle; no scroll-triggered reveal).
- Imagery: real screenshots only, beautified via mockup tool with palette-constrained backgrounds. Annotated figures via Excalidraw.
- Hero: B1.e Type + blueprint background. Header: H2 Plain Text transparent. Section transitions: B2.c Mixed. Selected Work: B3.d Tabbed + Mini Gallery (B3.b fallback). Project detail: D3.c Sticky Sidebar.

## Phases

Each phase produces something runnable and reviewable. Phases run sequentially because later phases depend on earlier scaffolding, but tasks **inside** a phase parallelize where called out.

### Phase 1 — Tokens & shell

Foundation that everything else consumes.

- **P1.1 Tailwind tokens** under `libs/landing/shared/ui/`: palette (background tiers `#0a0d12` → `#11151c` → `#1a2030`, slate text tiers, indigo accent `#6E66D9`), type scale (display 56/48/40/32, body 17/15/13, mono 12/11), spacing scale (multiples of 4), motion tokens (150/200/250ms ease-out).
- **P1.2 Font loading** — Newsreader, Inter, JetBrains Mono via `@fontsource` or self-hosted. `font-display: swap`. Variable fonts where available.
- **P1.3 Theme toggle** — Angular signal, persists in `localStorage`, SSR-safe initial paint (data attribute on `<html>` set before hydration). Light tokens derived from dark.
- **P1.4 Routing scaffold** — `apps/landing/` route table for 8 routes from E2 (`/`, `/projects`, `/projects/:slug`, `/uses`, `/colophon`, plus 404). Lazy load all sub-page modules.
- **P1.5 Layout shell** — `<landing-shell>` with H2 plain-text sticky header (transparent, no border) + footer signature line + `<router-outlet>`. Header surfaces 5 nav items + theme toggle + ⌘K stub + lang toggle stub.

Exit: empty pages route correctly, theme toggle works, fonts loaded, no copy yet.

### Phase 2 — Schema migrations

All 5 migrations in one Prisma set so the API and seed scripts stabilize together. Use the `prisma-migrate` skill.

- **P2.1** `Profile.timezone` (string) — for live-time widget on Card A.
- **P2.2** `Project.links` (jsonb array of `{label, url, type}`) — for D3.c sidebar links.
- **P2.3** `Skill.displayGroup` (enum) — for grouped skill rendering.
- **P2.4** `Project.sections` (jsonb array of `{anchor, heading, body}`) — D3.c body.
- **P2.5** `Project.tocAnchors` (jsonb array of `{anchor, label}`) — D3.c sticky ToC.

Exit: migrations applied to dev DB, Prisma client regenerated, repository methods in `apps/api` return the new fields.

### Phase 3 — Landing UI primitives

Per `CLAUDE.md`, landing pages use `landing-*` components exclusively. Build the small set everything composes from.

- `landing-button` (3 variants: solid indigo, ghost, link).
- `landing-link` (text + arrow `→` / `↗` variants, active state in indigo).
- `landing-chip` (mono caps, hairline border, no fill — for tech stack chips).
- `landing-eyebrow` (mono caps slate label).
- `landing-status-dot` (pill badge, 3 states: available, busy, away).
- `landing-figure` (img + 1px hairline border + mono caps `FIG. 0X · CAPTION` below).
- `landing-pull-quote` (Newsreader italic + 2px indigo left border).
- `landing-section-rule` (1px hairline + optional indigo top accent for B2.c lift).

All standalone components, signal inputs, OnPush. Test on `/ddl` route per project rule.

### Phase 4 — Home page sections

Compose from primitives. Order matches scroll order. Each section is its own component under `libs/landing/feature-home/`.

- **P4.1** `home-hero` (B1.e) — eyebrow, H1 sans + serif italic emphasis on "Engineer.", sub-line, status block bottom-right with availability dot + HCMC + AVAILABLE_FOR_HIRE. Faint hairline grid background (5–8% opacity, vanishing-point feel).
- **P4.2** `home-intro` (about strip, copy from E2 Card A).
- **P4.3** `home-selected-work` (B3.d) — 3 tabs (Document Engine first), 40/60 split, mini gallery 2×2 with `landing-figure` placeholders. B3.b text-only fallback for the 2 imageless projects at launch.
- **P4.4** `home-bio-card-grid` — 3 cards: identity (live time via `Profile.timezone`), philosophy, contact.
- **P4.5** `home-philosophy-strip` (E2 locked copy).
- **P4.6** `home-get-in-touch` — indigo top-border lift (B2.c important section).
- **P4.7** `home-footer-banner` ("There's more, if you're still here" — multi-page entry).
- **P4.8** `home-footer-signature` (mono caps line).

Verify against `.context/design/visual-feedback.md` workflow (chrome-devtools MCP screenshot per section).

### Phase 5 — Sub-pages

- **P5.1** `/projects` index (B3.c stacked editorial) — full archive list, all projects, year + role + 1-line summary per row.
- **P5.2** `/projects/:slug` detail (D3.c sticky sidebar) — hero screenshot full-bleed, left sticky sidebar (ToC + metadata + links), right reading column (eyebrow + H1 + serif italic deck + section headings + body + figures + pull-quote + next-project footer). Anchor scroll-to-section wiring, active-ToC-item indigo on scroll.
- **P5.3** `/uses` — sub-page quieter (D1 rule: less accent, more whitespace).
- **P5.4** `/colophon` — same quieter tone. "How this site was made" content.
- **P5.5** `/404` — typographic, on-brand.

### Phase 6 — Content authoring (folded from E3)

Content for the 3 V1 projects, written against the final D3.c schema. Use Procida Rules 2/3/4: show, value, specific.

- **P6.1** Console MVP case study — full depth: Problem → Approach → Outcome → What I'd Change. Real screenshots beautified + annotated. ~1500 words.
- **P6.2** Project 2 — same structure, ~700–1000 words. Imagery as available; B3.b text fallback if not.
- **P6.3** Project 3 — same. Imagery as available.
- **P6.4** `/uses` content — hardware, editor, terminal, CLI, browser, fonts. Specific (Rule 4): "iTerm2 with Solarized Dark", not "modern terminal."
- **P6.5** `/colophon` content — stack, tools, sources, credits.
- **P6.6** Profile content — `Profile.timezone = "Asia/Ho_Chi_Minh"`, bio, availability flag.

Each piece authored directly into the seed (or content store, decision below) — no draft staging area.

**Decision needed early in P6:** Is project content authored as Markdown files committed to the repo (rendered via a Markdown pipeline), as Prisma seed records, or via a tiny admin route in the existing console? Options:

- **Markdown in repo** (simplest, version-controlled, no CMS): `apps/landing/content/projects/<slug>.md` with frontmatter for metadata. Fits "no CMS unless proven need" from initiative.
- **Prisma seed records**: structured but content lives in TypeScript. Recompile to update.
- **Console admin page**: aligns with monorepo philosophy (one app, many surfaces). Reuses console form/editor. Heaviest investment.

Recommendation: start P6 with **Markdown in repo**. Promote to console admin if content grows.

### Phase 7 — SSR & perf gate

- **P7.1** Angular SSR for `apps/landing` — pre-render all static routes (`/`, `/uses`, `/colophon`, `/404`) and the 3 project detail pages.
- **P7.2** Image pipeline — `srcset` 1×/2×, `loading="lazy"` below the fold, `decoding="async"`. Preload hero screenshot only.
- **P7.3** Build size budget — first-load JS ≤ 150kB gzipped. Bundle analysis after each phase 4/5 component.
- **P7.4** Lighthouse smoke per page — must hit ≥ 80 across the four scores before E5 closes (≥ 95 is E6's job).
- **P7.5** Sitemap + robots — basic implementation; SEO polish in E6.

Exit: `pnpm build:landing` produces a deployable artifact, all routes prerender without error, Lighthouse smoke passes.

## Exit criteria for E5

- Every V1 page in the route table renders with real content from E2 (no "Lorem", no "Coming soon").
- All 5 schema migrations applied; API returns the new fields; seed populates 3 projects + profile + skills.
- Visual signature matches E4 direction on every page (cross-checked via chrome-devtools MCP screenshots in `.context/design/visual-feedback.md` workflow).
- SSR works; `pnpm build:landing` succeeds; smoke Lighthouse ≥ 80 each score, each page.
- E6 can open without any "still need to build" gaps.

## Risks

| ID | Risk | Mitigation |
| -- | ---- | ---------- |
| R1 | Phase 6 content authoring takes longer than implementation | Author Console MVP case study FIRST, in P6.1; if it slips, the rest of phase 6 can be parallelized or trimmed to one paragraph + headings + screenshots. |
| R2 | D3.c sticky sidebar ToC wiring on scroll is fiddly across SSR | Use `IntersectionObserver` client-side, server-render ToC inert. Test with browser back/forward + initial deep-link to anchor. |
| R3 | Two projects shipping with B3.b fallback (no imagery) feels thin at launch | Acceptable for V1 — fallback is documented in E4 and content depth (Procida 2/3/4) carries the case studies. Image upgrade is a post-launch task. |
| R4 | Bundle bloat from 3 font families + variable axes | Subset to Latin only. JetBrains Mono in two weights max. Audit during P7.3. |
| R5 | Theme toggle FOUC on first paint | Set `data-theme` on `<html>` from inline script before Angular bootstraps; SSR sends matching theme based on cookie. |

## Open questions

- Content store decision in P6 (Markdown / seed / admin) — defaults to Markdown in repo unless a reason emerges.
- Whether `/uses` and `/colophon` route-load at all or are statically rendered into the home footer banner — current plan: route-load (multi-page list from E2 mandates them as routes).
- Beautified-screenshot tool pick from `assets/moodboard/screenshot-tools.md` — not blocking; trial 2 during P6.1.
- ⌘K command palette: stub the icon hint in P1.5; full implementation deferred to E6 polish unless a clear need surfaces during P4/P5.

## Change log

- 2026-05-02 — Epic created. Phases 1–7 outlined. E3 descoped and folded into Phase 6 (content authoring). Direction inputs from E4 referenced. 5 schema migrations enumerated. Exit criteria + risks logged. Content-store decision deferred to start of Phase 6 with Markdown-in-repo as default.
- 2026-05-02 — Broken down via `/breakdown` skill. 29 tasks created (`.context/tasks/274-...` through `302-...`). Domain.md updated with new VOs (ProjectLink, ProjectSection, ProjectTocAnchor) + Skill.displayGroup field + 3 new PRJ rules (PRJ-008/009/010). Recommended start: 274-landing-tokens-and-fonts.
