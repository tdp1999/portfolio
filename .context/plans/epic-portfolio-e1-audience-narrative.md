# Epic E1: Audience & Narrative Discovery

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: Discovery complete. Outputs feed E2 (content) and E4 (UI/UX direction).

## Purpose

Define the audiences this site is built for, the position it claims, the through-line that unifies the work shown, and the reading pattern at 10s / 30s / 90s. Without this, content writing in E2 drifts generic.

## Position Claim

**Senior Frontend Engineer for fintech, Singapore market focus.**

This is what the friend-test surfaced ("Bạn này chuyên FE fintech nè, từng làm cho ngân hàng Sing"). It is what recruiters need in 5 seconds. It is what the CV evidence supports.

Visual aesthetic is **discovered**, not claimed. The site itself must demonstrate it; copy must not announce it.

## Through-line

**Systems builder.**

Looking across the artifacts shown, the pattern is the same in every one: the author builds the rails before the train. Patterns down before code. Tests before features. Design system before reaching for a UI library. Workflow system before tasks. This is the thread the 90s story makes explicit, and the gallery shows three times over.

Quote-able line for the page (confirmed in voice): *"I build the rails before I build the train."*

## Audiences

### Primary — Recruiter / hiring manager (full-time)

**Profile:**

- Recruiters at Western companies with HCMC offices (most realistic), or fully-remote roles in US / EU (aspirational).
- Hiring managers at product companies any size, where "chỉn chu và chuyên nghiệp" is observable from how they hire.
- Industry preference (silent in copy): fintech > crypto-adjacent > anything except gambling.

**Job-to-be-done:** decide in 30–90 seconds whether to read further or contact the author.

**What they need to see fast:**

- Name, role, level (Senior).
- Years of experience and current employer's market (Singapore fintech for 4 years).
- A standout artifact with a real outcome.
- Contact path.

**What earns the deep read:**

- Concrete projects with stated outcomes (not feature lists).
- Voice that signals fit (conversational, opinionated, not corporate, not over-modest).
- Evidence of breadth — full-stack, library author, tooling — under one coherent through-line.

### Secondary — Freelance client / 2nd-job hirer

**Profile:**

- Any engagement type **except body-shop** (staff-augmentation agencies that rent out engineers). Project-based, retainer, advisory, or direct contracting are all fine.
- VN clients and international clients both welcome.
- ~14h/week capacity (≈ 2h/day, evenings). Capacity should be hinted, not buried.

**Job-to-be-done:** decide whether the author can deliver and is reliable enough to engage.

**What they need:** outcome-focused case studies, clear contact path, professional vibe without corporate stiffness, a sense of capacity so they don't pitch a 40h/week role.

**Design decision:** build the site for the recruiter primary; add a friendly contact surface for the freelance client. Do **not** split the site or maintain two versions.

## Negative persona — implicit filter

The site does not target — and the copy/vibe should gently filter out — the following. None are named explicitly; the filter operates through tone, salary expectations subtly hinted, and absence of agency-friendly cues.

- Low-ballers (freelance bidders racing on price).
- Body-shop staff-augmentation agencies.
- Gambling industry.
- Roles requiring unfamiliar legacy stacks without compensating compensation.

## Channel map

The URL is expected to reach readers via these channels. Front page must therefore "introduce hard" — assume the reader has not heard of the author.

- CV PDF header.
- LinkedIn Featured section + headline link + custom URL.
- GitHub profile README.
- Email signature.
- Cover letter / DM body.
- Job site profile bios (LinkedIn Easy Apply, ITviec, TopDev, We Work Remotely, Wellfound).
- Word-of-mouth referral (someone passes the link in a chat, no prior context).

## Reading pattern

### 10 seconds — position

The hero gives the reader exactly the friend-test answer:

- **H1:** *Phuong Tran — Senior Frontend Engineer.*
- **Sub:** specialist line + systems through-line. Three candidate phrasings; final wording is an E2 deliverable.
  - *"Four years shipping fintech for the Singapore market. I build systems — document engines, design systems, dev workflows."* (mild systems pivot — current default)
  - *"Fintech in the Singapore market. Systems, libraries, dev workflows — usually in that order."* (more voice, "usually in that order" admits sequence honestly)
  - *"Four years shipping fintech tools for the Singapore market. Document engines, loan systems, permission frameworks."* (CV-clean, no through-line, fallback)

The hero must **not** claim "designer". Visual demonstrates aesthetic; copy stays in engineering territory. Friend test confirmed: aesthetic should be discovered, not announced.

### 30 seconds — proof

Three things, in this order:

**a. Project gallery (3 cards, gallery-style).** Document Engine is **first-among-equals**, sized or weighted slightly larger than the other two.

1. **Document Engine** *(Redoc, 2024–2025)* — Tiptap-based document editor replacing CKEditor for SME lending in fintech. 60% reduction in client working time. Eliminated annual licensing fees. Framework-agnostic core + Angular wrapper, both published as npm packages. Live demo with dynamic fields and restricted edit modes. Links: live demo · npm core · npm angular · repo.
2. **Portfolio Monorepo** *(personal, 2026)* — this site + console product + landing + shared libraries, all on one Nx monorepo. Full-stack solo: NestJS DDD backend, Angular signals frontend, design system written from scratch with documented context patterns. The product is small; the system around it is the point.
3. **TDP Plugins for Claude Code** *(personal, 2026)* — an AI workflow system the author built for himself and his team. Plugin marketplace for task-driven development with Claude Code: project setup, planning, epic breakdown, progress tracking. The very tool used to plan and build the site you are reading.

**b. Skills, situated (hybrid).**

- Tier 1 — situated prose paragraph in the author's voice, with tech names emphasized inline. Avoids bars/badges.
- Tier 2 — single condensed "Stack at a glance" line, plain text, comma- or middot-separated, ATS-scannable.

Stack-at-a-glance candidate (E2 to finalize):
> TypeScript · Angular · RxJS · Signals · SSR · Tiptap · ProseMirror · NestJS · Prisma · Postgres · Tailwind · SCSS · Nx · Jest · Playwright · Claude Code (plugin author)

**c. Voice + availability.**

- 2–3 sentences in the author's natural voice.
- Hint capacity: open to better full-time roles (remote-friendly preferred, not required) and ~14h/week of freelance.
- English fluency (TOEIC 970/990) surfaced subtly, not as a bullet.
- Contact links: email, LinkedIn, GitHub, CV PDF.

### 90 seconds — story

The arc the deep reader leaves with. Confirmed direction; final wording is E2.

> *"Frontend engineer, five years in, four of them at Redoc shipping fintech for the Singapore market. I led the Document Engine that replaces CKEditor across loan and finance products. I built the permission framework over a hundred sub-modules sit on. Real problems, real users, good people.*
>
> *Outside the day job, I keep building systems — a portfolio monorepo with a design system written from scratch, a Claude Code plugin marketplace I built for myself and my team. The pattern, looking back, is the same: I build the rails before I build the train. Patterns down before code. Tests before features. Design system before reaching for Material. Workflow system before tasks.*
>
> *None of these artifacts are individually remarkable. The interesting thing — if there is one — is that they share a way of working."*

Notes:

- Day-job pride opens the story. No resentment, no "implementing other people's designs" framing.
- "Outside the day job" is the connector — neutral, non-defensive, non-escapist.
- "I build the rails before I build the train" is the quote-able line.
- Closing vulnerability ("if there is one") is Procida Rule 9 — invites the reader, doesn't oversell.

## Voice decisions (locked)

- Conversational, the author's natural register.
- No corporate phrasing ("synergy", "passionate about", "results-driven").
- No ironic self-deprecation ("just a side project lol").
- No claim to "designer" identity. Visual sells aesthetic.
- Day job is treated with respect throughout. The site is **not** an escape narrative.
- AI / workflow tooling is described concretely ("an AI workflow system I built for myself"), not branded ("harness engineering").

## Friend-test priority order (from user)

When E4 (UI/UX direction) and E5 (implementation) trade off, prioritize in this order:

1. **Visual** — typography, spacing, palette, layout. Aesthetic must be discoverable in 3 seconds.
2. **Project showcase** — gallery cards must be visually rich (real screenshots, real motion if any, real color from each product).
3. **Content** — long-form story is for recruiters who read; friends will skim.

## Inputs into downstream epics

### → E2 (Content & Story Scaffolding)

- Draft 5–10 hero phrasings; pick one read-aloud-best.
- Write the three project cards. Each must have: scope-honest one-liner, outcome with number where possible, link set.
- Write the situated skills paragraph + Stack-at-a-glance line.
- Write the 90s story arc, English-first, in the author's voice. Read aloud test before locking.
- Write the colophon page ("How this site was made") — reachable via footer, not on the home page.

### → E4 (UI/UX Direction & Moodboard)

- Visual must carry the aesthetic claim. Hero must be a visual moment, not just words.
- Anti-pattern locked: scroll-triggered content reveal that delays readability.
- Anti-pattern locked: "Claude landing clone" aesthetic (gradient mesh, oversized rounded cards on Vercel-default look).
- Anti-pattern locked: skill bars, badge grids, AI-generic section sequence (About → Skills → Projects → Contact in obvious order with template UI).
- Reference signals (visual direction inspiration, not copying): railway.com (rail/scroll concept idea), Franco Ruiz portfolio (specialist density), Sharon (voice friendliness), Parth (typographic boldness). All have flaws to avoid; none to clone.
- Project cards must be visually rich. Document Engine first-among-equals (slightly weightier).
- Small-scale hover interactions (SVG nudge on hover) are welcome. No mandatory animations to read content.

### → E3 (Dummy Data Enrichment)

- Document Engine demo: confirm the live demo at <https://document-engine.thunderphong.com/> displays well in case-study screenshots. If demo data is sparse, enrich it with realistic SME-lending sample (Letter of Offer with dynamic fields).
- Console product: enrich seed data so screenshots feel populated (not empty states).

### → E7 (Launch & Promotion)

- Channel map above is the distribution list.
- Word-of-mouth + recruiter-direct paths assume cold context — confirm hero introduces hard at launch.

## Open questions deferred

- E2: exact final wording of hero, story, card copy. Deliberately not locked here.
- E2: whether "Colophon / How this site was made" deserves its own page or a long footer block.
- E4: visual direction (typography pair, palette, layout grammar) — entirely E4 work.
- E5: i18n architecture for cheap VN add-on without v1 bloat.

## Change log

- 2026-05-01 — Epic created and discovery completed. Position, through-line, audiences, channel map, 10s/30s/90s pattern, voice decisions all locked. Ready to feed E2 and E4.
- 2026-05-01 — 90s story opener softened from "Senior Frontend Engineer, five years in" → "Frontend engineer, five years in" to avoid implying five years held the Senior title. Hero still claims Senior (current title); story leans on years-shipping. See E0 §2 note.
