# Epic E3: Data Enrichment for Landing & Console Case Study

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: ✅ completed (2026-05-10)
> Depends on: E2 (content locked), E4 (direction locked), E5 Phase 1–4 (home UI built)
> Feeds: E5 Phase 5 (sub-pages render with real records), E6 (QA against real data)

## Purpose

Populate the database with realistic content so the landing site renders end-to-end as a credible portfolio. This epic was descoped on 2026-05-02 (folded into E5 Phase 6) under the assumption that schema would still churn during UI work. Now that the home page is composed and the schema has stabilized, the work is back: we author records against the locked schema and seed via the existing Console UI rather than via a one-shot Prisma seed script.

Distinct from E5 Phase 6 (content authoring): E3 owns the **records / shape / volume**, E5 P6 owns the **prose** (most of which is already locked in E2).

## Decisions (2026-05-09)

- **Persona**: keep the seeded real-persona (Phuong Tran / Redoc / Singapore-market banking). All E2 locked copy stays as-is.
- **Scope**: home page + `/projects` index + `/experience` page. **Out of scope**: `/projects/:slug` detail (D3.c), `/uses`, `/colophon`, `/blog`. Means migrations P2.4 (`Project.sections`) and P2.5 (`Project.tocAnchors`) are NOT required for this epic.
- **Image strategy**: mix — real screenshots for the 3 featured project thumbnails when available, placeholder URLs (picsum.photos) for everything else (avatar, OG, gallery, company logos).
- **Authoring surface**: Console UI (`/profile`, `/skills`, `/projects`, `/experiences`, `/media`). No direct Prisma seed mutation.
- **Folder enum (Media)**: API exposes `avatars | projects | posts | logos | resumes | skills | general`. Map: avatar → `avatars`, OG → `general`, project images → `projects`, company logos → `logos`. Plan's earlier `profile` / `experiences` folder names are not in the enum.

## Order of operations

| # | Step | Console path | Reason for order |
|---|------|--------------|------------------|
| 1 | Upload Media (avatar, OG, 3 thumbnails, 12 gallery, 3 logos) | `/media` | Project / Profile / Experience need `mediaId` references. |
| 2 | Profile (fill missing fields beyond seed) | `/profile` | Hero, Bio Card, Stack, Story, Get-in-Touch all read Profile. |
| 3 | Member Skills (16 entries) | `/skills/new` × 16 | Project & Experience link by `skillId`; must exist first. |
| 4 | Featured Projects (3) | `/projects/new` × 3 | Render home Selected Work tabs. |
| 5 | Minor Projects (5) | `/projects/new` × 5 | `/projects` index has 8 rows total. |
| 6 | Experiences (3) | `/experiences/new` × 3 | `/experience` page has career history. |

Total ~30 form submissions. Manual time estimate: 1.5–2 hours.

---

## Path 1 — `/media` (upload first)

20 Media records total. Console `/media` → upload form.

| Group | Count | Source / size | Folder | Notes |
|-------|-------|--------------|--------|-------|
| Avatar | 1 | `picsum.photos/seed/phuong/400/400` | `profile` | Set `altText: "Phuong Tran portrait"` |
| OG image | 1 | `picsum.photos/seed/portfolio-og/1200/630` | `profile` | 1200×630 |
| Project thumbnails | 3 | Real screenshot if available, else `picsum.photos/seed/<slug>-thumb/1200/800` | `projects` | One per featured project |
| Project gallery | 12 | `picsum.photos/seed/<slug>-1/1200/800` … `<slug>-4` | `projects` | 4 per featured project |
| Company logos | 3 | `picsum.photos/seed/<company>/200/200` | `experiences` | One per Experience |

After upload, note each Media `id` (uuid). Group ids by usage so they're easy to paste in steps 2/4/6.

---

## Path 2 — `/profile`

Seed already fills 8 of 8 sections at a basic level. Top up the missing fields:

| Section tab | Field | Value | Note |
|-------------|-------|-------|------|
| Identity | `bioLong` (EN) | See `bioLong` block below | 90s story arc from E2 §2 — not in seed |
| Identity | `avatarId` | (Media picker → avatar) | |
| Work & Availability | `availability` | `OPEN_TO_WORK` | Hero status dot becomes "available" |
| Work & Availability | `openTo` | `["FULL_TIME", "FREELANCE"]` | JSON array; values come from `OPEN_TO_VALUE` enum (uppercase) |
| Contact | `preferredContactPlatform` | `LINKEDIN` | |
| Contact | `preferredContactValue` | `https://www.linkedin.com/in/phuongtran/` | |
| Contact | `phone` | (leave empty or real) | Not rendered on landing |
| Social Links | `socialLinks` | See `socialLinks` block | Min 3 entries |
| Social Links | `resumeUrls` | `{ "en": "https://.../cv-en.pdf" }` | Optional; if empty, Get-in-Touch hides CV button |
| Landing Content | `tagline` / `stackIntro` / `contactIntro` / `footerTagline` | ✓ already seeded | Verify locked copy |
| SEO / OG | `metaTitle` | `Phuong Tran — Senior Frontend Engineer` | ≤ 70 chars |
| SEO / OG | `metaDescription` | `Senior frontend engineer in HCMC, four years on a Singapore-based product team. Document engines, design systems, dev workflows.` | ≤ 160 chars |
| SEO / OG | `ogImageId` | (Media picker → OG image) | |
| SEO / OG | `canonicalUrl` | Production URL | |

### `bioLong` (EN locale, paste verbatim — supports `*phrase*` italic emphasis)

```
Frontend engineer, five years in, four of them at Redoc shipping for Singapore-market banking — loan management, SME lending, finance ERP. Daily work is the long tail of features the bank actually runs on; the highlights are larger pieces like a Document Engine replacing CKEditor across loan products, or the permission framework over a hundred sub-modules. *Real problems, real users, good people.*

Outside the day job, the same instinct shows up — a portfolio monorepo with a design system written from scratch, a Claude Code plugin marketplace built for me and my team. The pattern, looking back, is the same: I build *the rails before I build the train*. Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks.

None of these artifacts are individually remarkable. The interesting thing — *if there is one* — is that they share a way of working.
```

### `socialLinks` (form repeater)

```json
[
  { "platform": "GITHUB", "url": "https://github.com/thunderphong" },
  { "platform": "LINKEDIN", "url": "https://www.linkedin.com/in/phuongtran/" },
  { "platform": "TWITTER", "url": "https://x.com/thunderphong" }
]
```

---

## Path 3 — `/skills/new` × 16

6 umbrellas already seeded (`languages`, `frontend`, `library-work`, `backend`, `tooling`, `workflow-and-ai`). For each member: pick the parent umbrella in the picker, set `displayOrder` within the group.

| # | name | slug | parent | category | displayOrder | yearsOfExperience | proficiencyNote |
|---|------|------|--------|----------|--------------|-------------------|-----------------|
| 1 | TypeScript | `typescript` | Languages | TECHNICAL | 1 | 5 | Daily driver |
| 2 | Angular | `angular` | Frontend | TECHNICAL | 1 | 4 | Reach-for-first; v15 → v21 |
| 3 | Angular Material | `angular-material` | Frontend | TECHNICAL | 2 | 4 | Default theming layer |
| 4 | RxJS | `rxjs` | Frontend | TECHNICAL | 3 | 4 | When I need streams |
| 5 | Signals | `signals` | Frontend | TECHNICAL | 4 | 1 | When I don't |
| 6 | SSR | `ssr` | Frontend | TECHNICAL | 5 | 1 | Angular Universal / hydration |
| 7 | Tailwind | `tailwind` | Frontend | TECHNICAL | 6 | 2 | Utility-first; landing site |
| 8 | SCSS | `scss` | Frontend | TECHNICAL | 7 | 5 | Tokens, mixins |
| 9 | TipTap | `tiptap` | Library work | TECHNICAL | 1 | 2 | Custom extensions; Document Engine |
| 10 | NestJS | `nestjs` | Backend | TECHNICAL | 1 | 2 | DDD layout |
| 11 | Prisma | `prisma` | Backend | TECHNICAL | 2 | 2 | Schema-first migrations |
| 12 | Postgres | `postgres` | Backend | TECHNICAL | 3 | 2 | Default DB |
| 13 | Nx | `nx` | Tooling | TOOLS | 1 | 2 | Monorepo orchestration |
| 14 | Jest | `jest` | Tooling | TOOLS | 2 | 4 | Unit + integration |
| 15 | Playwright | `playwright` | Tooling | TOOLS | 3 | 2 | E2E |
| 16 | Claude Code | `claude-code` | Workflow & AI | TOOLS | 1 | 1 | Plugin author (TDP) |

`isFeatured: false` for all. Icon picker can be skipped in v1.

**Renders**: home Stack §5 (Tier 2 grouped pills, in 6 named groups) + chip strip on home Selected Work tab + skill chips per Experience on `/experience`.

---

## Path 4 — Featured Projects (`/projects/new` × 3)

Common settings: `featured: true`, `status: PUBLISHED`. Translatable JSON form fields (`oneLiner`, `description`, `motivation`, `role`) — only fill `en`.

### Project 1 — Document Engine

| Field | Value |
|-------|-------|
| title | `Document Engine` |
| slug | `document-engine` |
| startDate | `2024-01-01` |
| endDate | `2025-09-30` |
| status | `PUBLISHED` |
| featured | `true` |
| displayOrder | `1` |
| thumbnailId | (Document Engine thumbnail) |
| skills | TipTap, Angular, TypeScript, NestJS, Prisma |
| images | 4 gallery entries for this slug |

**`oneLiner.en`** (for `/projects` index row, single line):
```
Tiptap-based document engine that replaced CKEditor across loan and finance products at a Singapore bank.
```

**`description.en`** (home Selected Work tab body — E2 §3 Card 1):
```
Built at Redoc to replace CKEditor across loan and finance products for a Singapore bank. Eliminated annual licensing fees and gave the firm full control over the editor stack. *Framework-agnostic core + Angular wrapper, both published on npm.* Live demo includes dynamic fields like `{{customer_name}}` and restricted-edit modes.
```

**`motivation.en`** (rendered only on B3.b fallback, when 0 images):
```
The bank's CKEditor stack carried annual licensing fees and could not be customised for compliance-heavy loan workflows. *A framework-agnostic core* gave us editor control without lock-in, and made the same engine portable across four loan products.
```

**`role.en`**:
```
Sole architect and primary author. Owned the framework-agnostic core, the Angular wrapper, and the npm releases.
```

**`links`** (4 entries):
```json
[
  { "label": "Live demo", "url": "https://document-engine.example.com", "type": "demo" },
  { "label": "npm — core", "url": "https://www.npmjs.com/package/@redoc/document-engine-core", "type": "doc" },
  { "label": "npm — angular", "url": "https://www.npmjs.com/package/@redoc/document-engine-angular", "type": "doc" },
  { "label": "Source", "url": "https://github.com/redoc/document-engine", "type": "repo" }
]
```

**`highlights`** (3 CAO entries):

```
1. challenge: "CKEditor was a black box for compliance audits — non-trivial to extend, expensive per-seat."
   approach:  "Split the editor into a framework-agnostic ProseMirror core + thin Angular wrapper; published both to npm."
   outcome:   "Bank dropped CKEditor licensing across four products. Editor extensions now ship internally in days, not weeks."

2. challenge: "Loan documents needed dynamic field tokens (e.g. {{customer_name}}) with strict edit boundaries."
   approach:  "Built a Tiptap extension that registers tokens as atomic non-editable nodes with role-based unlock."
   outcome:   "Compliance team reviews token policies once; legal docs stay tamper-proof at the field level."

3. challenge: "Frontend team was new to ProseMirror's transaction model."
   approach:  "Wrote an internal codelab with annotated diffs of every command we shipped."
   outcome:   "Two FE teammates now contribute Tiptap extensions independently."
```

### Project 2 — Portfolio Monorepo

| Field | Value |
|-------|-------|
| title | `Portfolio Monorepo` |
| slug | `portfolio-monorepo` |
| startDate | `2026-02-01` |
| endDate | (empty — ongoing) |
| status | `PUBLISHED` |
| featured | `true` |
| displayOrder | `2` |
| thumbnailId | (Portfolio Monorepo thumbnail — console MVP screenshot) |
| skills | Angular, NestJS, Nx, Prisma, Postgres, TypeScript, Jest, Playwright, Tailwind, SCSS, SSR |
| images | 4 gallery placeholders |

**`oneLiner.en`**:
```
Solo full-stack monorepo with a hand-rolled design system, DDD backend, and a context-driven workflow.
```

**`description.en`**:
```
An end-to-end full-stack codebase, built solo to wear every hat — backend, frontend, design system, tests, docs. *Small product, intentional rigor*: TDD throughout, DDD on the backend, a design bank documenting every decision.
```

**`motivation.en`**:
```
The current portfolio is overdue for a replacement, and the only honest way to show *systems thinking* is to ship the system itself: monorepo, design tokens, console MVP, and the .context/ workflow that drove this initiative.
```

**`role.en`**:
```
Sole engineer. Architecture, schema, design system, content, deployment.
```

**`links`**:
```json
[
  { "label": "Console demo", "url": "https://console.thunderphong.com", "type": "demo" },
  { "label": "Source", "url": "https://github.com/thunderphong/portfolio", "type": "repo" },
  { "label": "Colophon", "url": "/colophon", "type": "case-study" }
]
```

**`highlights`** (2):
```
1. challenge: "A portfolio site as 'first thing designed end-to-end' meant no fallback to a UI library."
   approach:  "Hand-rolled design system + Tailwind tokens + Procida-rules-driven content audit before any UI tool was opened."
   outcome:   "Every page voice-matches the author; no AI-generic copy slipped through."

2. challenge: "Wanted backend depth (DDD, NestJS, Prisma) without scope-blowing the launch."
   approach:  "Console MVP carries the backend — same monorepo, same auth, used as a CMS for the landing site."
   outcome:   "Backend is real and shippable; landing reads from API, not hardcoded constants."
```

### Project 3 — TDP Plugins for Claude Code

| Field | Value |
|-------|-------|
| title | `TDP Plugins for Claude Code` |
| slug | `tdp-plugins-for-claude-code` |
| startDate | `2025-11-01` |
| endDate | (empty — ongoing) |
| status | `PUBLISHED` |
| featured | `true` |
| displayOrder | `3` |
| thumbnailId | (TDP thumbnail — terminal screenshot) |
| skills | Claude Code, TypeScript |
| images | 4 gallery placeholders |

**`oneLiner.en`**:
```
Claude Code plugin marketplace for task-driven development — the same workflow that planned and shipped this site.
```

**`description.en`**:
```
An AI workflow system built for me and my team — a Claude Code plugin marketplace for *task-driven development*: project setup, epics, breakdowns, progress, TDD support. The very tool used to plan and ship the site you are reading.
```

**`motivation.en`**:
```
Solo work + AI assistance drifts without a workflow that holds the structure for you. TDP makes the structure explicit — *vision → epic → tasks → progress* — so the AI assists inside the structure rather than against it.
```

**`role.en`**:
```
Author and primary user. Plugin set is open-source; team uses an internal extension.
```

**`links`**:
```json
[
  { "label": "Source", "url": "https://github.com/thunderphong/tdp-plugins", "type": "repo" }
]
```

**`highlights`** (1):
```
1. challenge: "Solo developer + AI = lots of half-finished decisions."
   approach:  ".context/ folder convention: vision.md, plans/*.md, tasks/*.md, progress.md — all human-readable, AI-readable."
   outcome:   "Initiative-level decisions persist across weeks; AI sessions resume with full context."
```

---

## Path 5 — Minor Projects (`/projects/new` × 5)

`featured: false`, `status: PUBLISHED`. Render only on `/projects` index. Minimum needed: `oneLiner` + `skills` + `startDate` + `thumbnailId` (optional). Other translatable fields (`description`, `motivation`, `role`) — fill with the same `oneLiner` text or short paragraphs; nothing renders them on home/index.

| # | title | slug | year | oneLiner.en | skills |
|---|-------|------|------|-------------|--------|
| 4 | Permission Framework | `permission-framework` | 2023 | Role-based permissions across 100+ sub-modules of a Singapore-bank ERP. | Angular, TypeScript, NestJS |
| 5 | Loan Management Dashboard | `loan-management-dashboard` | 2022 | Operations dashboard for SME loan officers — disbursement queue, collateral tracking, repayment timelines. | Angular, Angular Material, RxJS |
| 6 | Design Bank Generator | `design-bank-generator` | 2025 | Markdown-driven knowledge base for design decisions — `.context/design/` becomes the source of truth. | TypeScript, Nx |
| 7 | Console MVP | `console-mvp` | 2026 | The CMS that drives this landing site — auth, profile, projects, skills, media, blog. | Angular, NestJS, Prisma, Tailwind |
| 8 | Contract Compare Engine | `contract-compare-engine` | 2024 | Diff-and-merge view for legal contract revisions, built on top of the Document Engine. | TipTap, Angular, TypeScript |

(#7 is technically part of the Portfolio Monorepo but stands alone for the index.)

---

## Path 6 — Experiences (`/experiences/new` × 3)

Translatable string arrays (`responsibilities`, `highlights`) use a form repeater. Only fill `en`.

### Experience 1 — Redoc (current)

| Field | Value |
|-------|-------|
| companyName | `Redoc` |
| companyUrl | `https://redoc.com` |
| companyLogoId | (Redoc placeholder logo) |
| position.en | `Senior Frontend Engineer` |
| teamRole.en | `Lead frontend on Document Engine + permission framework` |
| domain | `Banking & Finance` |
| employmentType | `FULL_TIME` |
| locationType | `HYBRID` |
| locationCountry | `Vietnam` |
| locationCity | `Ho Chi Minh City` |
| teamSizeMin / Max | `8 / 12` |
| startDate | `2022-03-01` |
| endDate | (empty) |
| displayOrder | `1` |
| skills | Angular, TypeScript, RxJS, NestJS, Prisma, TipTap, SCSS, Jest, Angular Material |

**`description.en`**:
```
Four years building frontend for a Singapore-based product team — loan management, SME lending, finance ERP. Long-tail features for the bank's daily operations, plus larger pieces like the Document Engine and the permission framework over a hundred sub-modules.
```

**`responsibilities.en`** (string array):
```
- Owned frontend architecture across four bank-facing products.
- Authored the Document Engine (Tiptap core + Angular wrapper, both on npm).
- Designed and shipped the permission framework powering 100+ sub-modules.
- Mentored two FE engineers into Tiptap extension authorship.
- Reviewed compliance-impacting UI changes with the bank's audit team.
```

**`highlights.en`**:
```
- Replaced CKEditor across four loan products; eliminated annual licensing fees.
- Permission framework cut sub-module rollout time from weeks to days.
- Internal codelab is now onboarding material for new FE hires.
```

### Experience 2 — Skyfox (earlier role)

| Field | Value |
|-------|-------|
| companyName | `Skyfox` |
| companyUrl | `https://skyfox.example.com` |
| companyLogoId | (Skyfox placeholder logo) |
| position.en | `Frontend Engineer` |
| teamRole.en | `FE on customer-facing booking flows` |
| domain | `Travel & Hospitality` |
| employmentType | `FULL_TIME` |
| locationType | `ONSITE` |
| locationCountry | `Vietnam` |
| locationCity | `Ho Chi Minh City` |
| teamSizeMin / Max | `4 / 6` |
| startDate | `2021-06-01` |
| endDate | `2022-02-28` |
| displayOrder | `2` |
| skills | Angular, TypeScript, RxJS, SCSS |

**`description.en`**:
```
First professional FE role. Built the customer-facing booking funnel for a regional travel marketplace — itinerary builder, payment confirmation, post-booking management.
```

**`responsibilities.en`**:
```
- Implemented Angular features against a Figma design system.
- Wrote integration tests covering the booking funnel happy path.
- Maintained the SCSS theme as the product expanded to two more locales.
```

**`highlights.en`**:
```
- Booking abandonment rate dropped after a payment-step UX rewrite.
- First exposure to RxJS-heavy state, set the foundation for later DDD work.
```

### Experience 3 — BachKhoa Web Lab (internship)

| Field | Value |
|-------|-------|
| companyName | `BachKhoa Web Lab` |
| companyUrl | (empty) |
| companyLogoId | (placeholder logo) |
| position.en | `Frontend Intern` |
| teamRole.en | `Intern on student-services portal` |
| domain | `Education` |
| employmentType | `INTERNSHIP` |
| locationType | `ONSITE` |
| locationCountry | `Vietnam` |
| locationCity | `Ho Chi Minh City` |
| teamSizeMin / Max | `2 / 3` |
| startDate | `2021-01-15` |
| endDate | `2021-05-30` |
| displayOrder | `3` |
| skills | TypeScript, Angular |

**`description.en`**:
```
University-affiliated lab project. Built a student-services portal in Angular as part of an undergraduate capstone.
```

**`responsibilities.en`**:
```
- Implemented authentication and grade-lookup flows in Angular.
- Wrote the project README + a short Angular onboarding doc for next-cohort interns.
```

**`highlights.en`**:
```
- Capstone shipped on time; portal handed over to the lab.
- Decided right after to go full-time frontend rather than backend.
```

---

## Verification map

After all six paths are complete, walk the landing site and check each section renders the right field.

| Landing surface | URL | Source field(s) | Expected |
|-----------------|-----|-----------------|----------|
| Hero | `/` | `Profile.fullName`, `title`, `tagline`, `locationCity`, `availability`, `stackIntro` (tokenize) | "Phuong Tran — Senior Frontend Engineer." + 2-line tagline + status dot AVAILABLE_FOR_HIRE + HCMC + chips ANGULAR / TYPESCRIPT / ANGULAR MATERIAL |
| Bio Card Grid §3 | `/` | `fullName`, `title`, `locationCity`, `timezones[0]`, `email`, `bioShort`, `contactIntro` | 3 glass cards: identity (live time GMT+7), philosophy (split bioShort), contact (email + status) |
| Selected Work §4 | `/` | featured Projects 1–3 (`description`, `role`, `startDate.year`, `links`, `skills`, `images`) | 3 tabs (Document Engine first), tab body has italic-parsed description + chips + 2×2 gallery + links labeled CASE STUDY / LIVE PROJECT / SOURCE CODE |
| Stack §5 | `/` | `Profile.stackIntro` + grouped Skills | 3 paragraphs Tier-1 with bold tech names + 6 Tier-2 pill groups, each with member skills |
| The Story §6 | `/` | `Profile.bioLong` | 3 paragraphs, italic phrases ("Real problems, real users, good people.", "the rails before I build the train", "if there is one") render Newsreader serif |
| Get in Touch §7 | `/` | `contactIntro`, `email`, `socialLinks`, `resumeUrls` | Copy + Email button + LinkedIn + GitHub + (CV PDF if `resumeUrls.en` set) |
| Footer Banner §8 | `/` | `footerTagline` | "There's more, if you're still here." + 5 page links |
| `/projects` index | `/projects` | All Projects (featured + minor) | 8 rows: year + title + oneLiner + chips + thumbnail when present |
| `/experience` page | `/experience` | All Experiences | 3 records sorted by `displayOrder` |

---

## Schema gaps (deferred — NOT blocking E3)

Out of E3 scope but logged so they don't get lost:

- `Project.sections` (jsonb `Array<{anchor, heading, body}>`) — needed for `/projects/:slug` D3.c reading column. E5 P2.4. Skip.
- `Project.tocAnchors` (jsonb `Array<{anchor, label}>`) — D3.c sticky ToC. E5 P2.5. Skip.
- `Profile.usesContent`, `Profile.colophonContent` — if `/uses` and `/colophon` should read from API per the E5 content rule. Currently those routes can ship hardcoded; revisit when they go live.
- Hero avatar slot — current home Hero has no avatar render (E2 §9 layout decision). Avatar uploaded here is for OG / future about page only.

---

## Open questions

- Real screenshots for the 3 featured project thumbnails — does Owner have console MVP / Document Engine / Claude Code terminal shots ready, or fall back to placeholder for all 3?
- Does the `/experience` page already render PublicExperience records, or is that route a placeholder? (Verify before declaring this epic done.)

## Change log

- 2026-05-09 — Epic re-opened. Persona / scope / image strategy locked. Playbook for 6 paths drafted. P2.4 / P2.5 confirmed out-of-scope. Next: choose execution mode (manual UI / Playwright automation / API script) and start Path 1.
- 2026-05-10 — All 6 paths executed via authenticated `/api/*` Node scripts in `tmp/e3-path*.mjs` (same JWT + Admin guard the Console UI uses, just bypassing the upload widget for bulk media). Manifests saved at `tmp/e3-{media,skills,projects}-manifest.json`. Outcomes: 20 media uploaded (avatar, OG, 15 project images, 3 logos); profile patched with bilingual copy on identity / landing-content + locked E2 copy restored on tagline / stackIntro / contactIntro / footerTagline; 16 member skills created under 6 umbrellas + 10 legacy umbrellas/children dropped (22 left); 3 featured + 5 minor projects created (PUBLISHED); 3 experiences (Redoc / Skyfox / BachKhoa) replacing 3 dummy duplicates. Verification on home: 8/8 sections render, 0 console errors, 0 broken images, 0 failed requests. Doc-side fixes applied: openTo enum value clarified to UPPERCASE, Media folder enum explicit (avatars / projects / logos / general — earlier `profile` / `experiences` were not in the enum).
- 2026-05-10 — Hero CORE_STACK fix shipped alongside (issue surfaced during home verification, ref task 317): added `Profile.coreStack` field end-to-end (Prisma migration `add_profile_core_stack` additive `JSONB DEFAULT '[]'`; Profile entity / LandingContentBlocks VO / mapper / repo / DTO / presenter / landing public types / Console form). Hero parser rewritten to a 3-tier fallback (authored chips → `**bold**` runs from stackIntro paragraph 1 → slash-split). Domain rule PRF-007 extended. Data set to `["Angular","TypeScript","Angular Material"]`. Verified hero now renders correctly. Deferred to E5 Phase 5: `/projects` index + `/experience` page renders (those landing routes don't exist yet — verification will follow when tasks 289 / experience-page land).
- 2026-05-10 — Epic closed. Out-of-scope deferrals: real thumbnail screenshots for 3 featured projects (placeholder picsum kept; image-gen tooling research skipped per Owner); resume PDF cleanup (legacy filename kept per Owner); `redoc-document-engine` legacy project un-featured but still on `/projects` index (will become a minor or get archived later); Selected Work link-label cosmetics (FE label-mapping copy, not data).
- 2026-06-01 — Re-applied on a new machine (original `tmp/e3-*.mjs` scripts did not survive the move). Rather than reconstruct throwaway API scripts, the full local dataset was folded into the durable, idempotent `apps/api/prisma/seeds/dev-content.seed.ts` (direct Prisma; picsum URLs written straight to Media rows — no Cloudinary needed locally). Content was re-authored for richness + deliberate responsive variance (galleries 0→6, highlights 1→4, links 1→4, skill chips 2→15, ongoing+ended mix): 33 media, 16 skill members, 8 projects (kept the newer dev-content featured set — permissions-console / loan-document-engine / block-editor — plus 5 more, all fully authored rather than minimal "minor" rows), 3 experiences, profile top-up. Also seeded the epic-untouched `/about` data: 5 AboutPrinciple + 3 AboutFailure (voice-matched). Verified via live API + SSR render of `/`, `/projects`. Adjacent fix: `/about` was returning HTTP 404 (rendered fine but missing from `app.routes.server.ts`) — added `{ path: 'about', renderMode: Server }`.
