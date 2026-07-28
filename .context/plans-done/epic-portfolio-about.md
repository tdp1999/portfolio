# Epic: About page — `/about` as the deep "who & proof" surface

> Status: broken-down (drafted 2026-05-21; broken down into tasks 329-342 on 2026-05-22)
> Depends on: `epic-experience` (done — provides `PublicExperience` schema + landing service), `epic-profile` (done — bilingual content fields), `epic-portfolio-e5-implementation` (done — landing platform).
> Feeds: launch readiness. `/about` is the **dedicated hiring-funnel surface** — home is the front door, `/about` is the credibility room.
> Touches task 328 (`/now`) — pivots its scope (see C2). Task 328 re-spec is **not in this epic** but blocks task 336.

## Specialized Skills
- **ng-lib** — Nx Angular library generator with correct tags/prefix/import path → task 329
- **component-bank** — per-component design doc with behavior contract + quality checklist → task 331
- **aqa-expert** — Playwright POM, soft assertions, console/network monitoring → task 342

## Purpose

Replace the `coming-soon` placeholder at `/about` with a single deep page that absorbs `/experience` and adds the persona/proof surfaces home cannot carry without losing its rhythm. Goal is **informative + opinionated**, not narrative — distinct from the home "Story" section which keeps its storytelling voice.

The page serves two personas simultaneously:

- **Recruiter / HR (10-second scan):** hero positioning, sticky-tab company list, manifesto headline.
- **Tech lead / founder (3-5 min read):** manifesto principles, failures essays, full role detail.

`/experience` route is retired — about is the **single source of truth** for work history.

## Non-goals

- **Highlights strip** ("4-6 cross-role metric cards" from research) — deferred; author hasn't decided on metrics shape. Slot is removed from v1 IA, can be added later between hero and currently-shipping.
- **"Beyond code" / hobbies section** — explicitly dropped. About tone is informative-not-narrative; humanity belongs to home Story.
- **Decision journal signature** — dropped for v1. Revisit after `/blog` ships (decisions become a tag filter on blog, About links out).
- **Education + Certifications section** — already inside `Profile.certifications[]`, defer surface decision; if shown, becomes a compact inline list near hero meta, not a full section.
- **Photo on hero** — home hero already has portrait; About is text-driven.
- **Resume PDF download as a primary CTA** — kept as a quiet inline link near hero (`Profile.resumeUrls`), not a button.

## Decisions locked this session (2026-05-21)

Ground truth for every downstream task in this epic.

### Audience & tone

- **Audience scope:** recruiter + tech lead + freelance client (same triad as `/contact`). Press goes through `/contact`, not About.
- **Tone:** informative, opinionated, defensible. Every adjective must be paired with proof within the same viewport. No "passionate / clean code / users first" filler.
- **Voice differentiator vs home Story:** home is voice-led prose (lamp + pen interaction, light typography). About is structured surfaces — sections have headings, bullets carry metrics, prose is shorter and load-bearing.

### Information Architecture — Variant C "Show, then tell, then prove"

```
1. HERO        text-only, positioning H1 + sub-paragraph + meta strip + 2 CTAs
2. EXPERIENCE  sticky-tab two-column (accordion on mobile), sourced from /experience data
3. HOW I THINK manifesto-lite, 5-7 numbered principles with bold claim + 2-3 sentence expansion
4. FAILURES    signature, 3 anonymized clinical essays (~150 words each)
5. CTA         "Hiring, partnering, or just curious?" → /contact + LinkedIn + GitHub + CV
```

**Reserved slot (deferred):** highlights strip between hero and experience. Add when author decides metrics shape.

**Dropped 2026-05-22 (review pass on DDL variants):**
- **Depth map** (originally between EXPERIENCE and HOW I THINK) — duplicated home §04 "The Stack" (same `tierGroups` data, same chip rendering). The differentiator (per-Daily rationale) couldn't carry it because `Skill.proficiencyNote` is null on most rows.
- **Currently shipping** (originally between HERO and EXPERIENCE) — duplicated the standalone `/now` page (same 4-field shape, same render). `/now` stays as the canonical surface for external traffic (LinkedIn bio, RSS, Sivers /now community). `/about` may later add a 1-line bridge in the hero meta strip if author wants.

Tasks 333 / 334 / 336 stay shipped as DDL exploration; task 337 only graduates **failures**.

### `/experience` → `/about` (C1)

- **Redirect 301** at the Angular routes layer (preserves SSR). `/experience` → `/about#experience`.
- Sitemap drops `/experience`.
- External links to `/experience` (LinkedIn, CV PDF, llms.txt) updated as a follow-up checklist item, not a hard blocker.
- `feature-experience` lib **kept** — its sticky-tab UI lives inside About; we don't delete the lib, we re-mount its component (or refactor into a smaller sub-component) under About.

### `/now` pivot — task 328 must be re-spec'd (C2)

Author overrides task 328 spec ("markdown-driven, no console, no DB"). New direction:

- **`/now` becomes console-managed.** New `Now` module: schema, entity, command/query handlers, console editor page, API endpoint, landing page.
- **Content shape options to be decided in task 328 v2** (one of):
  - **Freeform translatable text** (single `body` field per locale, markdown rendered) — closest to original task spec, just moved to DB.
  - **Structured 4 fields** — `nowBuilding`, `nowWriting`, `nowLearning`, `lastShipped` (all translatable). Easier as a tight 4-line strip.
  - **Hybrid** — structured 4 fields + optional freeform appendix.
- ~~About's "Currently shipping" section subscribes to the same data source.~~ **Resolved 2026-05-22:** /about no longer has a currently-shipping section (dropped — duplicated /now). /now stays standalone; task 328 v2 still in scope.
- **Blocking dependency removed:** task 336 was the only About-side consumer; it's now done-as-dropped. /now ships on its own cadence.

### Experience UI — sticky-tab two-column

- **Pattern:** Brittany Chiang v4 — left rail with company list, right panel with role detail.
- **Mobile fallback (< 768px):** accordion fold, default-open = latest role.
- **Order:** reverse-chronological. No date-grouping or theme-grouping in v1.
- **Fields rendered per role:**
  - `position` + `companyName` + `companyUrl` + `companyLogoUrl`
  - `startDate` – `endDate` (humanized: "May 2024 – Present")
  - `domain` (work domain — single field per ADR-015)
  - `teamRole`, `teamSizeMin/Max`, `employmentType`, `locationType` + `locationCity/Country` (combined as a meta strip: "Team of 6 · Tech lead · Full-time · Remote, Hanoi")
  - `highlights[]` — the primary content (3-5 bullets per role, verb-scope-metric formula)
  - `responsibilities[]` — secondary, shown under a "Day-to-day" sub-heading, collapsible
  - `skills[]` — chips with icons (reuse `chip` + `landing-icon`)
  - `links[]` — labeled bullets at footer of detail panel (`{label, url}` shape per ADR-015)
- **Field NOT shown:** none — sticky-tab has room. If detail panel becomes long, `responsibilities` is the section that collapses.

### Hero composition

- **Text-only** — no portrait (home hero already carries portrait).
- **Positioning H1:** single declarative sentence answering "who builds what for whom" (≤ 18 words). Author writes per content brief.
- **Sub-paragraph:** 2-3 sentences with years, domain, current availability framing.
- **Meta strip:** `Saigon · GMT+7 · ● Open to consulting · Last updated <month YYYY>`. Availability state pulled from `Profile.availability` + `Profile.openTo`. "Last updated" is a hardcoded field updated on each substantive content edit (not auto from `updatedAt`).
- **CTAs:** primary `[Read my story]` (anchors to `#how-i-think` or scrolls past hero), secondary `[Get in touch]` (→ `/contact`). Quiet inline `Download CV (EN/VI) →` below CTAs.

### Signature elements (1 — staged in DDL first)

Goes to `/ddl/about-signatures` with 2-3 visual variants. Author compares side-by-side and graduates one variant per signature into `/about`. DDL page is kept as historical record per the no-delete rule.

1. **Failures & lessons** — 3 essays, ~150 words each. **Anonymized** (no company name — "At a fintech I led in 2022..."). **Clinical tone** — decision → consequence → lesson, no emotional arc. Source: hard-coded in landing component or markdown file (decide during task breakdown — leaning markdown to allow easy edits).

**Originally 3 signatures.** Two were dropped on the 2026-05-22 DDL review pass:
- **Depth map** — duplicated home §04 "The Stack" (same data, same chip rendering, no real differentiator).
- **Currently shipping** — duplicated the standalone `/now` page (same 4-field data, same render).

Sandboxes for both stay live as historical record; tasks 333 / 334 / 336 remain shipped; task 337 only graduates failures.

### Manifesto-lite ("How I think about software")

- 5-7 principles, each: bold one-line claim + 2-3 sentence expansion.
- Stance-driven, not generic. Author writes per content brief.
- Numbered (1-7), not bulleted, to signal hierarchy and let author reorder by importance.
- **No links to essays in v1** — links can be added later when `/blog` exists.
- Source: hard-coded translatable strings in landing component for v1. Promote to `Profile.principles[]` (translatable JSON) only if author wants console editing. Defer that BE work.

### Failures section content rules

- **3 essays, fixed, not rotating.** Curated, not all failures author ever had.
- **Anonymized:** "At a fintech 2022", "At an agency 2019" — no company names. Burned bridges + NDA + legal risk all mitigated.
- **Clinical tone:** decision → consequence → lesson. Avoid emotional arc (that's home territory).
- **Structure per essay:** ~150 words. Context (year, domain, scale). Specific bad decision (named tech / pattern). Outcome (quantified if possible: "cost N weeks of recovery"). Lesson applied since.
- **Anti-pattern:** "I worked too hard" / "I cared too much" / performative humility — flag during review.

### Bilingual scope

- **All sections content translatable EN+VI**, consistent with rest of landing.
- **Manifesto + failures essays:** author writes EN first (default lang for technical depth), VI translation as a separate sub-task (can ship EN-only at first cut if VI lags).
- **`/now` content:** translatable from data source (see C2 for shape options).

### DDL strategy

- **1 page** `/ddl/about-signatures` with 3 sections originally (depth-map, failures, currently-shipping). Depth-map + currently-shipping sandboxes kept as historical record but dropped from production graduation (2026-05-22 review pass). Effective graduation set = **1 (failures)**.
- **2-3 variants per section** rendered side-by-side or stacked with clear divider.
- **Sequential build:** DDL ships first → author picks winners → graduate each to `/about`. Other About sections (hero, sticky-tab, manifesto-lite text) can be scaffolded in parallel — they have no variant exploration needed.
- **DDL page kept after graduation** per project rule. Winner marked inline.

### Routing & SEO

- `/about` route added in landing app routes — uses new feature lib (proposed: `libs/landing/feature-about`).
- `/experience` → `/about#experience` 301 redirect.
- Page title (`<title>` + `og:title`): "About — Phương Trần" / "Về tôi — Phương Trần".
- Meta description = the hero sub-paragraph.
- JSON-LD `Person` schema already injected from `/` home — verify `/about` also injects (likely via shared meta service from `epic-portfolio-contact` F6 fix).
- Sitemap updated: drop `/experience`, add `/about`.

## Risks

1. **Sticky-tab pattern is a meme.** Brittany Chiang v4 has been copied for years. To differentiate, the *content* (failures, manifesto) and the *typography* must do work; the tab pattern alone is no longer signature.
2. **Failures section is the highest-content-risk surface.** If essays are performative or vague, the section actively damages credibility. Author may need a writing pass with someone tough on prose.
3. **Manifesto principles drift toward generic.** "I prefer types over tests" is fine; "I love clean code" must be flagged. Review pass before graduate.
4. **`/now` console-managed pivot bloats scope.** Task 328 was S-complexity; now it touches BE schema + module + console + API. ~~Without it, About signature 3 cannot ship — but rest of /about can ship independently.~~ **Resolved 2026-05-22:** /about no longer depends on /now (currently-shipping section dropped). Task 328 ships on its own cadence; doesn't block /about.
5. **`/experience` deep links in external systems (LinkedIn, CV, third-party).** 301 covers most; some scrapers may break. Acceptable.
6. **Anonymized-failures legal:** "At a fintech in 2022" is still partially identifying. Author confirms any specific framing in essays during content review.
7. **`feature-experience` lib status post-merge** — refactored into a sub-component of `feature-about`, OR `feature-experience` deleted with its component re-homed inside `feature-about`. Pick one in task breakdown to avoid two libs with one consumer.

## Out-of-scope (explicit defers)

- Highlights strip metrics — defer until author has 4-6 defensible numbers.
- Decision journal — defer until `/blog` ships.
- Console-managed manifesto / failures content — keep hardcoded/markdown in v1. Promote to BE when edit cadence proves it's needed.
- Photo / portrait variant — keep text-only.
- Animation / motion design for sticky-tab — stick to instant tab switch in v1. Polish later.
- "Anti-resume / what I don't do" section — interesting but author hasn't decided fit; can add later as a sibling to manifesto.

## Open questions (track during build)

- **Q1:** Manifesto principles — translatable JSON in `Profile` (Console-editable) OR hardcoded translatable strings in landing component? **Default v1:** hardcoded; promote later.
- **Q2:** Failures content storage — markdown files (mirror `/now` markdown precedent from task 325) OR hardcoded in landing component? **Default v1:** markdown files, one per locale (`failures.{en,vi}.md`), parsed at SSR.
- **Q3:** `feature-experience` lib disposition — refactor or delete-and-re-home? **Decide in task breakdown.**
- **Q4:** "Last updated" date on hero — manual field in component OR pulled from latest `Skill.updatedAt` / `Profile.updatedAt`? **Default:** manual constant updated on each substantive edit (more honest, less misleading than auto).
- ~~**Q5:** Depth-map rationale per Daily tool — `Skill.proficiencyNote` field exists, but is it populated?~~ **Resolved 2026-05-22:** depth map dropped from /about IA (duplicates home §04 The Stack). Q5 no longer relevant.

## Content writing brief (author task)

To be written by author in parallel with build. Tasks reference this section.

### 1. Hero positioning H1 — 1 sentence (≤ 18 words)
Answer "who – does what – for whom". Don't open with "Hi I'm…".
Pattern: *"Senior software engineer building DDD-grade web platforms for fintech & SaaS teams."*

### 2. Hero sub-paragraph — 2-3 sentences (~30-50 words)
Context for H1: years, domain, current availability framing.

### 3. Manifesto — 5-7 principles
Each: bold one-line claim + 2-3 sentence expansion ("why I believe this"). Must have defensible stance.
**Anti-pattern:** "Clean code matters", "users first", "ship fast".
**Topic seeds:** code review style · feature flags vs branches · DDD pragmatism · types vs tests vs docs · monorepo discipline · documentation tax · async-first culture · build vs buy threshold · over-engineering taste · refactor cadence.

### 4. Failures — 3 essays × ~150 words
Per essay: context (year, anonymized company, tech/scale) → decision → consequence (quantified if possible) → lesson applied since. **Anonymized, clinical tone.**
**Anti-pattern:** "I worked too hard", performative humility.

### 5. Depth-map rationale — 1 line per Daily tool
Why this is your default-reach. ~10-15 words each. Audit `Skill.proficiencyNote` first — may already cover.

### 6. Experience highlights — audit existing `highlights[]` per role
Rewrite to **verb-scope-metric formula**: *"Led migration to Nx monorepo (~12 apps, 40 libs) — cut CI time 18min → 4min."*
**Anti-pattern:** "Worked on the frontend", "Helped the team".

### 7. /now content (depends on C2 pivot direction)
Per task 328 v2.

### 8. CTA copy
Single line at page end. Pattern: *"Hiring, partnering, or just curious? → /contact"*.

## Task breakdown preview

To be cut as individual task files in `.context/tasks/` via `/ctx:breakdown` when this epic is approved. Approximate ordering and complexity:

| # | Task | Complexity | Depends on |
|---|---|---|---|
| T1 | `/now` task 328 re-spec — choose content shape (freeform / structured / hybrid), update task file. **Separate task, not in this epic** but blocks T9. | S | — |
| T2 | `feature-about` lib scaffold + route + 301 redirect from `/experience` | S | — |
| T3 | About hero (text-only, meta strip, CTAs) | S | T2 |
| T4 | Sticky-tab experience component (refactor from `feature-experience` or re-home) — desktop two-column + mobile accordion | M | T2, audit of `feature-experience` |
| T5 | Manifesto-lite section UI (5-7 numbered principles, hardcoded translatable strings) | S | T2 |
| T6 | `/ddl/about-signatures` page scaffold (3 sections with placeholder variants) | S | T2 |
| T7 | Depth-map variants on DDL (2-3) | M | T6 |
| T8 | Failures variants on DDL (2-3) — uses markdown-file source pattern from task 325 | M | T6 |
| T9 | Currently-shipping variants on DDL — depends on /now task 328 v2 schema | M | T6, T1 (/now data shape decided) |
| T10 | Graduate winning signatures from DDL to `/about` | S | T7, T8, T9, author picks |
| T11 | About CTA section + page composition + scroll-spy nav | S | T3, T4, T5, T10 |
| T12 | SEO meta + JSON-LD Person + sitemap update + footer link audit | S | T11 |
| T13 | Content authoring per writing brief (author task, parallel to build) | M | — |
| T14 | Bilingual VI translation pass | S | T13 EN content done |
| T15 | E2E test pass (Playwright) — sticky-tab interaction, redirect, signature renders | M | T11 |

## Acceptance criteria (epic-level)

- [ ] `/about` route loads with all 5 IA sections (hero, experience, how-i-think, failures, CTA). Depth-map + currently-shipping dropped 2026-05-22 (see C above).
- [ ] `/experience` returns 301 to `/about#experience` (verified in prod)
- [ ] Sticky-tab works on desktop (≥ 768px), accordion on mobile
- [ ] All sections render in EN + VI
- [ ] Failures section renders 3 essays, anonymized + clinical-toned
- [ ] Manifesto renders 5-7 principles with claim + expansion
- [ ] SEO meta + JSON-LD + sitemap updated
- [ ] Lighthouse smoke: A11y ≥ 95, BP ≥ 95, SEO ≥ 95, Performance ≥ 80 (desktop)
- [ ] Type-check + landing prod build clean
- [ ] E2E `about.spec.ts` passes — covers tab interaction, redirect, signatures render, locale switch

## References

- Research report (in-session 2026-05-21): NN/G About Us guidance, Brittany Chiang v4, Josh Comeau effective-portfolio, Derek Sivers /now, Wes Bos uses, Maggie Appleton about/now/garden, Cassidy Williams timeline.
- ADR-015 (Experience content model — responsibilities/highlights/links/drop clientIndustry).
- ADR-013 + ADR-014 (long-form chassis + save semantics) — relevant if /now goes console-managed.
- task 325 (legal pages) — precedent for markdown-driven landing pages, applies to failures section.
- task 328 (/now) — needs re-spec per C2.
