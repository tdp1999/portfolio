# Epic E2: Content & Story Scaffolding

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Reads from: [E0 — Author Databank](./epic-portfolio-e0-author-databank.md), [E1 — Audience & Narrative](./epic-portfolio-e1-audience-narrative.md)
> Status: In progress.

## Purpose

Write all prose for the v1 site as plain text, in English, in the author's voice — before any UI tool is opened. This epic is the heaviest cognitive lift in the initiative because it is the part AI cannot fake: the human voice, the specific phrasing, the honest scope.

When this file says **LOCKED**, that copy is committed. Until then, every section has variants under discussion.

## Working rules

- English first. Vietnamese parking lot only.
- Voice register matches E0 §8 (voice samples). Do not over-polish out of the natural register.
- Read-aloud test: every locked sentence must sound like the author when read aloud. If it sounds like LinkedIn, rewrite.
- Procida rules ride along: 2 (show), 3 (value), 4 (specific), 7 (story), 8 (proud), 12 (be human).

## Section order (decision sequence)

1. **Hero** — H1 + sub-line. Sets tone for everything else.
2. **90s story arc** — the deep-read paragraph. Locks the voice.
3. **Project cards** — three artifacts, copy each.
4. **Skills situated + Stack at a glance**.
5. **Voice & availability** (30s position c).
6. **Colophon** — "How this site was made", reachable via footer.

Each section moves through: variants drafted → user reacts → locked variant + alternates parked.

---

## 1. Hero

### Status: **LOCKED 2026-05-01.**

### Locked

**H1:** Phuong Tran — Senior Frontend Engineer.

**Sub:** Four years shipping fintech tools for the Singapore market. Document engines, loan systems, permission frameworks.

**Rationale:**

- V3 (CV-clean, no through-line) chosen, with "at Redoc" deliberately dropped.
- Dropping "at Redoc" keeps the hero employer-agnostic. Current-employment sensitivity respected; the work becomes the personal claim, not the company. Recruiter who wants the employer name can find it in the gallery / CV.
- Mirrors the friend-test answer directly ("FE fintech, làm cho ngân hàng Sing").
- Through-line ("systems builder") becomes the gallery's job to imply — accepted trade-off.

### Variants under discussion

All variants share H1: **Phuong Tran — Senior Frontend Engineer.**

Sub-line variants:

**V1 — Specialist + systems pivot** *(current default from E1)*
> Four years at Redoc shipping fintech for the Singapore market. I build systems — document engines, design systems, dev workflows.

- Tradeoff: dense and informative. Covers position, credential, through-line, and three artifact hints in two sentences. "I build systems" pivots from credential to through-line cleanly.
- Risk: the "I build systems" line, in isolation, can read slightly grandiose if not paired with proof immediately below.

**V2 — Voice-led, "usually in that order"**
> Fintech in the Singapore market. Systems, libraries, dev workflows — usually in that order.

- Tradeoff: shortest, most voice. "Usually in that order" admits sequence honestly (Procida 12) — this is how the author actually works (system first, then library, then workflow).
- Risk: drops "Four years at Redoc" — credential becomes an inference from H1 alone. Recruiter scan may want the year+company sooner.

**V3 — CV-clean, no through-line** *(fallback)*
> Four years at Redoc shipping fintech tools for the Singapore market. Document engines, loan systems, permission frameworks.

- Tradeoff: directly mirrors the friend-test answer. Pure credential + concrete artifact types.
- Risk: no through-line means the gallery below has to do more work to imply "systems builder". Lower payoff at 90s.

**V4 — Quote-line forward** *(uses "rails before train")*
> Four years building frontend for fintech. I tend to write the rails before the train — patterns, tests, design systems, then the feature.

- Tradeoff: leads with the quote-able line. Highest voice signature. Reader who only catches the sub-line still gets a memorable image.
- Risk: drops "Singapore market" specificity from sub-line; trains/rails metaphor is opinionated and may polarize.

**V5 — Action-led**
> I build frontend systems for fintech in the Singapore market. Document engines, design systems, dev workflows — and the patterns underneath.

- Tradeoff: starts with a verb ("I build"), strong. "And the patterns underneath" hints at through-line without claiming "systems builder" out loud.
- Risk: "I build…" openings appear on many engineer portfolios; less differentiated than V2/V4 voice.

### Alternates / parking lot

*(filled as variants get rejected; capture phrases that are reusable elsewhere even if not for hero)*

### Decision criteria for hero

When choosing, ask:

1. Read-aloud test — does it sound like the author when read out loud?
2. 5-second test — name + role + relevance, all visible?
3. Friend-test alignment — would a friend describe the author this way? ("FE fintech, Singapore bank, has aesthetic.")
4. Through-line — is the systems thread visible, or does it depend on gallery doing the work?
5. Voice differentiator — could this appear on 100 other portfolios, or only this one?

---

## 2. 90s Story Arc

### Status: **LOCKED 2026-05-01.**

### Locked

> *"Frontend engineer, five years in, four of them at Redoc shipping for Singapore-market banking — loan management, SME lending, finance ERP. Daily work is the long tail of features the bank actually runs on; the highlights are larger pieces like a Document Engine replacing CKEditor across loan products, or the permission framework over a hundred sub-modules. Real problems, real users, good people.*
>
> *Outside the day job, the same instinct shows up — a portfolio monorepo with a design system written from scratch, a Claude Code plugin marketplace built for me and my team. The pattern, looking back, is the same: I build the rails before I build the train. Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks.*
>
> *None of these artifacts are individually remarkable. The interesting thing — if there is one — is that they share a way of working."*

### Decisions locked

- 3 paragraphs (not trimmed to 2). At 90s mark, reader has earned the breath.
- "at Redoc" kept in story (dropped only from hero); 90s reader has earned credibility-by-name.
- Domain-first opening: "Singapore-market banking — loan management, SME lending, finance ERP" leads. Document Engine + permission framework are explicit *highlights*, not exhaustive list. Avoids reading as "those are my only two contributions".
- "*Real problems, real users, good people.*" kept — direct day-job pride; AI-resistant phrasing; matches author's stated affection for the work.
- Strongest vulnerability close kept: "*None of these artifacts are individually remarkable*" + "*if there is one*". Anti-"tự cao" anchor. Procida 9 in full strength.
- Quote-line locked: **"I build the rails before I build the train."** Option A chosen (over Option B "write the rails before the train"). The "I" moment in paragraph 2 is intentional — it is the only first-person of the paragraph, which gives it emphasis as the personal confession.
- "I"-count reduced from 4 (initial draft) → 1 (locked). The single "I" is the rails line. Earned, not over-used.
- Credentials (Bachelor's, Valedictorian, TOEIC 970) deliberately not surfaced anywhere in site copy. CV carries them; site does not. Trust-the-work principle.

### Alternates / parking lot

- Option B variant of paragraph 2 (universal-imperative "write the rails before the train") rejected — too principle-flavored, lost the personal confession quality. Phrase preserved here in case a future surface (Colophon? About?) wants the universal form.

### Read-aloud notes

- Para 1 ends on three-beat: "Real problems, real users, good people." Short, falling rhythm. Designed to land.
- Para 2 ends on a list of four ("Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks."). Cumulative, builds.
- Para 3 ends on hedge: "if there is one... share a way of working." Exit on humility, not flourish.

---

## 3. Project Cards

### Status: **LOCKED 2026-05-01.**

### Locked

**Voice convention for all cards:** third-person, descriptive. Cards are gallery-zone; story is the only first-person surface. This creates a clean voice shift between scan-zone and read-zone.

#### Card 1 — Document Engine *(first-among-equals; visually weighted larger)*

> **Document Engine** — Tiptap/ProseMirror
>
> *Built at Redoc to replace CKEditor across loan and finance products for a Singapore bank. Eliminated annual licensing fees and gave the firm full control over the editor stack. Framework-agnostic core + Angular wrapper, both published on npm. Live demo includes dynamic fields like `{{customer_name}}` and restricted-edit modes.*
>
> [Live demo · npm core · npm angular · repo]

#### Card 2 — Portfolio Monorepo

> **Portfolio Monorepo** — Angular 21 · NestJS · Nx
>
> *An end-to-end full-stack codebase, built solo to wear every hat — backend, frontend, design system, tests, docs. Small product, intentional rigor: TDD throughout, DDD on the backend, a design bank documenting every decision.*
>
> [console demo · repo · colophon]

#### Card 3 — TDP Plugins for Claude Code

> **TDP Plugins for Claude Code**
>
> *An AI workflow system built for me and my team — a Claude Code plugin marketplace for task-driven development: project setup, epics, breakdowns, progress, TDD support. The very tool used to plan and ship the site you are reading.*
>
> [repo]

### Decisions locked

- Card 1: V1 chosen (outcome-led / business framing).
- Card 2: V2 chosen (practice-led).
- Card 3: V1 chosen (meta-loop framing). The "very tool used to plan and ship the site you are reading" is the meta-hook AI portfolios cannot fake.
- All cards rewritten in third-person for voice consistency across the gallery. Story remains the only first-person surface.
- **60% client-working-time stat dropped from Card 1.** Author clarified that number was attached to a broader project transformation across 3–4 apps Redoc built for the bank, not Document Engine specifically. Attaching it to Card 1 would be an overclaim. Procida 12 enforced.
- Author employer (Redoc) and client framing (Singapore bank) explicit on Card 1 — gallery-zone is the right place to name names; hero stays employer-agnostic.
- No "I designed this" claim anywhere in cards. Visual carries the aesthetic claim per E1.

### Alternates / parking lot

- **60% stat** is real and earned but not Document-Engine-specific. Reusable in: a future "outcomes" surface, About page if added, or a freelance pitch context. Source: client-stated post-rollout.
- Card 1 V2 (engineering-led architecture description) parked. Reusable phrasing for the Colophon or a deeper Document-Engine case-study page if v2 of the site adds one.
- Card 2 V1 ("the system around it is the point") phrasing parked. Strong line, may resurface in About / Colophon.
- Card 3 V2 (capability-led, ".context/ folder convention") parked. Reusable for the TDP Plugins repo README if it gets a refresh.

---

## 4. Skills situated + Stack at a glance

### Status: **LOCKED 2026-05-01 (revised).**

### Locked

**Tier 1 — situated prose** (first-person, opinion-zone, three short paragraphs):

> *"Daily, I reach for **Angular**, **TypeScript**, and **Angular Material**.*
>
> *Beyond that: **RxJS** when I need streams, **signals** when I don't, a custom **TipTap** extension when the editor work goes deep.*
>
> *When the work needs a backend too, **NestJS** + **Prisma** + **Postgres** with DDD. Tests in **Jest** and **Playwright**. I write the design system before reaching for a UI library."*

**Tier 2 — Stack at a glance** (grouped pills with icons, Parth-style):

| Group | Pills |
|-------|-------|
| Languages | TypeScript |
| Frontend | Angular · Angular Material · RxJS · Signals · SSR · Tailwind · SCSS |
| Library work | TipTap |
| Backend | NestJS · Prisma · Postgres |
| Tooling | Nx · Jest · Playwright |
| Workflow & AI | Claude Code (plugin author) |

### Decisions locked (revised)

- Tier 1: 3 short paragraphs, not 2. Daily core / secondary FE / backend-tests-design. Each paragraph is one cognitive bite.
- Tier 1 daily core dropped RxJS and Signals — author clarified these are not what he reaches for *every day*; they are situational. Moved to paragraph 2 ("when I need streams... when I don't").
- TipTap pulled out of the daily-core bucket; framed as "when the editor work goes deep" — situational depth, not daily reach.
- Tier 2 reorganized into 6 named groups instead of one flat list. Visual grouping carries scan-friendliness; named labels make the buckets meaningful. Recruiter Ctrl+F still hits all keywords.
- ProseMirror dropped from Tier 2 pills — TipTap is the consumer-facing name; ProseMirror is its underlying library and surfaces in Document Engine card / case studies if needed.
- "Workflow & AI" as a category label is intentional — gives the Claude Code (plugin author) signal a proper home rather than tucking it as an asterisk at the end of a flat list.

### Read-aloud notes

- "RxJS when I need streams, signals when I don't" — opinionated voice tic; AI-resistant.
- "a custom TipTap extension when the editor work goes deep" — concrete, anti-generic.
- "I write the design system before reaching for a UI library." — closing claim. Signals systems-builder through-line.

---

## 5. Section 7 — Get in Touch (primary contact)

### Status: **LOCKED 2026-05-01.**

### Locked

> *"I'm in HCMC, working with the Singapore market. Open to full-time roles, and a small slice of freelance on the side, full-stack with frontend depth."*
>
> [Email · LinkedIn · GitHub · CV PDF]

### Decisions locked

- V2 chosen with two author edits.
- "**better** full-time roles" → "full-time roles" — dropped "better" because it implicitly signals dissatisfaction with the current job; violates the no-resentment rule (E0 §11). Recruiters can still infer "open to opportunities" without the comparative.
- "around 14 hours a week" — dropped explicit hours. Capacity is negotiable in conversation; nailing it down early can either over-claim or under-claim depending on the inquiry. Better to leave the hours flexible and discuss per-case.
- Voice tic preserved: "*a small slice of freelance on the side*" — matches E0 §8 register.
- TOEIC 970/990 not surfaced (per E0 §10 trust-the-work principle).

### Note on overlap with Section 3 Card C and Section 8

Three contact-adjacent surfaces, each plays a distinct role:

- **Section 3 Card C** — quick "Available for work" indicator + email + Connect CTA. Glance-zone.
- **Section 7 (this)** — primary contact zone with full availability copy + all contact links. Read-zone.
- **Section 8** — cross-page navigation. Not a contact zone.

No triple-repetition; each layer adds something the layer above did not.

## 6. Section 3 — Bio Card Grid (NEW)

### Status: structure locked; Card B **LOCKED 2026-05-01**.

### Structure (Parth-style 3-card grid)

**Card A — Personal:**
- Name (large)
- Location: HCMC, Vietnam
- Local time / timezone (live, GMT+7)
- Social link icons: GitHub · LinkedIn · X (if applicable)

**Card B — Bio short (voice paragraph):**
- 2–3 sentences in voice
- Distinct from 90s story (which lives in section 6)
- Bridges hero ("what I do") → gallery ("look at it")
- Variants drafted below

**Card C — Available-for-work CTA:**
- "Available for work" status indicator
- Email with copy-to-clipboard
- "Connect now" or "Get in touch" CTA → anchor to Section 7

### Card B — LOCKED

> *"Five years in, four with a Singapore-based product team. I've come to like the feature work nobody asks me to brag about — the design system before the screen, the test before the bug, the workflow before the task. Less glamorous; more durable."*

V3 chosen — personal arc, soft, admits preference for invisible work. "Less glamorous; more durable" is the closer.

### Alternates / parking lot

- V1 (process-focused, "invisible until you try to break it") — strong line; reusable in `/uses` page intro or Colophon.
- V2 (domain-focused, "slow code beats fast code in most of those meetings") — opinion-load; reusable in Experience page intro or a future blog post.

### Constraints (still apply)

- ~2-3 sentences max. Card is a glance-zone, not a read-zone.
- No skill-list. Skills section follows; do not preempt.
- No project name-drop. Gallery follows; do not preempt.
- Voice register: matches E0 §8 voice samples.

## 7. Section 8 — Footer Banner (NEW)

### Status: **LOCKED 2026-05-01.**

### Locked

> *"There's more, if you're still here."*
>
> Experience · Projects · Blog · Uses · Colophon

### Decisions locked

- V2 chosen — "*if you're still here*" carries voice + humility + invites without performing. Matches E0 §8 register ("có gì để mất đâu chứ" attitude).
- 5 page links: Experience · Projects · Blog · Uses · Colophon. Home implicit (header nav). Contact handled by Section 7 above; not duplicated here.
- Section sits between Section 7 (Get in Touch) and the proper Footer (Section 9). Visual register should be a typographic moment, larger than body text but smaller than hero.

### Alternates / parking lot

- V1 ("Want to dig deeper?") parked. Reusable as Header CTA microcopy or end-of-blog-post nav.
- V4 (descriptive labels: "Career history · Every project I've kept · Writing · What I use · How this site was made") parked. Reusable as Header tooltip-text or sitemap-page intro.

## 8. Colophon — "How this site was made"

### Status: not drafted; lower priority, footer-reachable.

### Outline

- The meta-loop: this site was planned with TDP Plugins for Claude Code; built on the portfolio monorepo; design choices logged in `.context/design/`.
- Tools used (typography, palette, etc — depends on E4 outcome).
- Acknowledgment / inspiration credits if any.
- Technical: framework, deployment, why these choices.

## 9. Page Layout Master (LOCKED 2026-05-01)

The home page (`/`) section sequence:

1. Header (multi-page nav)
2. Hero (name + role + sub-line; **avatar circle dropped**)
3. **Bio Card Grid** (NEW — see §6)
4. Selected Work (3 cards; Document Engine *slight* visual emphasis, not first-among-equals)
5. The Stack (Tier 1 prose + Tier 2 grouped pills)
6. The Story (90s deep read)
7. Get in Touch (primary contact zone)
8. **Footer Banner** (NEW — multi-page nav, see §7)
9. Footer (legal, copyright, repeat secondary links)

### Notes vs original outline

- Skills moved from after Story to before Story. Reasoning: scan-zone (skills) leads into read-zone (story); reader who bounces at skills still got the breadth signal.
- Document Engine: "first-among-equals" → "slight emphasis only" (user revision). The visual hierarchy still favors it but the gap is narrow.
- Hero: avatar circle dropped per E0 §14 (no headshot decision yet) and to keep hero typographic.

## 10. Multi-Page Site Map (LOCKED 2026-05-01)

### v1 — must ship

| Route | Page | Purpose |
| ----- | ---- | ------- |
| `/` | Home | Section 1–9 layout above |
| `/work` or `/experience` | Experience | Long-form CV-style career history; expanded from Profile.bioLong + Experience records |
| `/projects` | Projects (gallery) | Deeper version of home Selected Work — all projects, filterable |
| `/projects/:slug` | Project Detail | One page per project — uses Project + TechnicalHighlight (CAO) data |
| `/blog` | Blog | List of posts; can ship empty/coming-soon for v1, populate over time |
| `/blog/:slug` | Blog Post | One page per post |
| `/colophon` | Colophon | "How this site was made" — meta page about the build process |
| `/contact` | Contact | Form (writes to ContactMessage in API) + contact info |

8 routes. The blog can ship empty (or with 1 inaugural post — author's call) since the system already supports it (BlogPost model exists, `feature-blog` lib exists).

### v1 — buffer page (recommended add)

| Route | Page | Purpose |
| ----- | ---- | ------- |
| `/uses` | Uses (Gear) | What hardware, editor, AI tools, daily setup. Aligns with systems-builder identity ("the rails I work on"). Authentic, AI-resistant. Hand-curated. |

`/uses` is a known web genre — uses.tech indexes them. Fits Phuong's identity strongly because the page IS about the tools and patterns that make daily work possible — same systems-thinking thread as the Stack section, just personal-scale.

### v2 — parking lot

- `/now` (Derek-Sivers convention) — what I'm working on right now. Adds another buffer surface but requires periodic update; defer until maintenance commitment exists.
- `/labs` — small experiments / tools. Defer until there's something to put there beyond the existing 3 case-study artifacts.
- `/links` — generic; weak fit. Skip.
- `/guestbook` — vibe mismatch with Senior FE professional voice. Skip.
- `/testimonials` — high authenticity bar; defer until 2–3 real ones can be sourced (and authorized for public use).

### Why this set

User reading through portfolio, in expected scan order: Home → Projects (if intrigued by gallery) → Experience (if recruiter) → Contact (if convinced). Blog and Uses are buffer/depth surfaces that don't bear the primary load. Colophon is meta-zone for the curious reader.

This satisfies the "buffer pages add variety so important sections stand out" principle: `/uses` is the buffer that signals craft and personality without competing with the substantive `/work` and `/projects` pages. Adding more buffer (e.g. `/labs`, `/now`) is parking-lot territory — could add later if v1 feels too thin after launch.

## 11. System Gaps — migrations needed for v1 (tag for E5)

The api/console schema mostly supports v1 content. Three small additive migrations needed:

| # | Field | Model | Why | Priority |
| - | ----- | ----- | --- | -------- |
| 1 | `timezone` String? | Profile | Section 3 Card A displays local time (e.g. GMT+7). Existing location fields don't carry timezone. | Required |
| 2 | `links` Json @default("[]") | Project | Project has only `sourceUrl` + `projectUrl` (2 links). Document Engine needs 4 (live demo + npm core + npm angular + repo). Pattern: copy from `Experience.links` (already an array of `{label, url}`). | Required |
| 3 | `displayGroup` String? | Skill | Pills group into Languages / Frontend / Backend / Library / Tooling / Workflow & AI — existing `category` enum has only 3 generic values (TECHNICAL/TOOLS/ADDITIONAL). Free-form `displayGroup` is most flexible. | Required |

### Things that work as-is (no migration)

- Profile: `fullName`, `title`, `bioShort`, `bioLong`, `email`, `socialLinks`, `availability`, `openTo`, location fields, `resumeUrls` — all good.
- Project: `oneLiner`, `thumbnailId`, `status`, `featured`, `displayOrder`, `skills` relation — all good. The "Built at Redoc for a Singapore bank" text fits naturally in `oneLiner`.
- Story long-form: write into `Profile.bioLong` (translatable JSONB; supports VN parking lot).
- Contact form: `ContactMessage` + `ContactMessageStatus` + `ContactPurpose` enums all exist.

### Optional (defer unless needed)

- `Skill.iconSlug` String? — alternative to `iconId + Media` for using simple-icons.org slug strings. Lighter, no upload required. Current Media-based icons work fine; defer unless Media-driven becomes friction.
- `Profile.tagline` Json — translatable short quote. Skip; `bioShort` carries Card B content.

### Migration plan (E5)

- 3 additive fields, all backwards-compatible (nullable / default empty array / default empty string).
- No data backfill required — landing app reads with sensible defaults if null.
- Use prisma-migrate skill when E5 starts.

---

---

## Change log

- 2026-05-01 — Epic created. Hero variants V1–V5 drafted. Other sections scaffolded with directional drafts and open questions, awaiting hero lock before sequential passes.
- 2026-05-01 — Hero LOCKED. V3 chosen with "at Redoc" dropped. Sub-line: *"Four years shipping fintech tools for the Singapore market. Document engines, loan systems, permission frameworks."*
- 2026-05-01 — 90s story LOCKED. Domain-first reframe in paragraph 1 (highlights-as-examples, not exhaustive list). I-count reduced 4 → 1. Credentials excluded from site copy by design. Quote-line locked: "I build the rails before I build the train."
- 2026-05-01 — Project Cards LOCKED. Cards 1/2/3 chosen V1/V2/V1. All cards converted to third-person voice for consistency across gallery zone. 60% stat dropped from Card 1 (overclaim risk — broader transformation, not Document-Engine-specific). Redoc + Singapore bank client named in Card 1.
- 2026-05-01 — Skills section REVISED. Tier 1 split into 3 short paragraphs (was 2). Daily core narrowed to Angular/TypeScript/Angular Material; RxJS/Signals/TipTap moved to situational paragraphs. Tier 2 reorganized into 6 named groups (Languages / Frontend / Library work / Backend / Tooling / Workflow & AI) with Parth-style pill grid layout intent.
- 2026-05-01 — Page Layout MASTER LOCKED. 9 sections on home, 2 new (Bio Card Grid §3, Footer Banner §8). Skills moved before Story. Hero avatar dropped. Document Engine repositioned as "slight emphasis" (was "first-among-equals").
- 2026-05-01 — Multi-Page Site Map LOCKED. 8 v1 routes (Home, Experience, Projects gallery + detail, Blog list + detail, Colophon, Contact). Buffer page recommendation: `/uses` (Gear) — fits systems-builder identity. v2 parking: /now, /labs, /links, /guestbook, /testimonials.
- 2026-05-01 — System Gaps documented. 3 additive migrations needed for v1: Profile.timezone, Project.links, Skill.displayGroup. Tagged for E5 implementation via prisma-migrate skill.
- 2026-05-01 — Card B (Section 3 middle card) LOCKED. V3 chosen — "Five years in, four with a Singapore-based product team. I've come to like the feature work nobody asks me to brag about..."
- 2026-05-01 — Section 7 (Get in Touch) LOCKED. V2 with author edits — dropped "better" (no-resentment) and explicit hours (negotiable).
- 2026-05-01 — Section 8 (Footer Banner) LOCKED. V2 — "There's more, if you're still here." + 5 page links.
- 2026-05-01 — **E2 closed.** All home-page sections drafted and locked. Colophon section content deferred to E5/E6 (depends on E4 visual outcome). Other v1 pages (Experience, Projects detail, Blog, Uses, Contact form) get their own minor copy passes during implementation; bulk of content lift is done.
