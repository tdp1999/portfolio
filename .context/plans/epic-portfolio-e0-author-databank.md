# Epic E0: Author Databank

> Parent: [Initiative: Portfolio](./initiative-portfolio.md)
> Status: Living document. All other epics in this initiative read from this. Update as new facts surface.
> Purpose: One source-of-truth for *who the author is*, *what they have done*, *how they sound*, and *what they like / dislike*. Without this, every epic re-discovers the same context.

## How to use this file

- E1 (audience), E2 (content), E4 (UI direction) all reference this. When an epic asks "what does the author actually sound like?" or "what artifacts can we showcase?", the answer is here, not in chat history.
- When a new fact surfaces in conversation, add it here. Cite the turn / source if useful.
- Treat the **voice samples** section as a copy-writing reference. When drafting English-language copy in E2, the goal is to preserve the spirit of these Vietnamese phrasings — not literal translation.

---

## 1. Identity — the basics

| Field | Value |
| ----- | ----- |
| Full name | Tran Duc Phuong |
| Display name | Phuong Tran |
| Handles | `tdp1999` (GitHub primary), `phuong-tran-1999`, `phuong-tran-redoc` (work-affiliated) |
| Location | Ho Chi Minh City, Vietnam |
| Email | `tdp99.business@gmail.com` |
| LinkedIn | `linkedin.com/in/tdp1999` |
| Personal site (legacy, to be replaced) | <https://thunderphong.com/> |
| English | TOEIC 970/990 (2022–2024). Daily working language. International recruiter audience is realistic. |
| Education | B.E. in Computer Networks & Communications, Can Tho University (09/2017 – 02/2022). Valedictorian. |
| Current employer | Redoc (Singapore-based; HCMC office). At Redoc since 08/2022. Current title: Senior Frontend Engineer (held ~1 year as of 2026-05). |

## 2. Career timeline

```
2017-09 ─────────────────────────────────────────────────────────────── 2026-05
  │                                                                       │
  ├── BE @ Can Tho University (Valedictorian) ── 02/2022                  │
  │                                                                       │
  ├── Junior FE @ AppCore (Can Tho) ── 01/2022 → 05/2022 (~4 months)      │
  │   • B2B eCommerce, landing pages, inventory mgmt                      │
  │   • Australian-market clients, team of 10                             │
  │                                                                       │
  └── Senior FE @ Redoc (Singapore co. / HCMC office) ── 08/2022 → now    │
      • Banking (loan management, SME lending), Finance, Real Estate ERP  │
      • Singapore market primarily                                        │
      • 3 projects involved; team size 5–8                                │
      • Methodology: Agile/Scrum                                          │
      • Title progression at Redoc fluid; Senior title held ~1 year       │
```

**Total experience as of 2026-05:** ~5 years FE total; ~4 years at Redoc; Senior title held ~1 year. Note on title: in IT generally — and in this case specifically — role titles are fuzzy and company-defined. Treat "Senior" as a current label, not as a time-served credential. Copy should lean on **years shipping** ("five years building frontend for fintech") rather than **years at title** ("five years as Senior").

## 3. Notable accomplishments at Redoc

Stated outcomes drawn from the CV (verifiable on request):

- **Led the Document Engine** that replaced commercial editors (CKEditor) across loan and finance products. Eliminated annual licensing fees. Achieved technological autonomy. *(See artifact §6.1.)*
- **Permission framework** spanning 100+ sub-modules — comprehensive role/scope system underlying multiple products.
- **PDF manipulation** infrastructure for digital signing and automated document generation.
- **Architectural foundations** on multiple core projects — set the patterns the team builds on.
- **Cross-functional partnership** with BAs, POs, QA Engineers; transformed Excel-based and paper-based workflows into digital flows. Stated outcome: ~60% reduction in client working time.

## 4. Tech depth

### Primary

- **TypeScript** — daily; primary language for everything below.
- **Angular** — every version v8 → v21+. Standalone, signals, SSR, Nx monorepo, complex form manipulation, RxJS, NgRx.
- **Tiptap / ProseMirror** — production-shipped custom extensions (Document Engine).
- **Decoupled multi-package architecture** — designs core/wrapper splits.

### Secondary (working knowledge, real-world shipped)

- **NestJS** + **Prisma** + **Postgres** — full-stack work, DDD patterns (visible in this monorepo's API).
- **HTML / SCSS / Tailwind / Angular Material** — responsive design, design systems written from scratch.
- **Jest / Playwright** — testing discipline, TDD, E2E with POM.
- **Nx** — monorepo orchestrator across all current personal/professional work.
- **Cloudflare Pages**, GitHub/Bitbucket, Postman, Figma, Adobe XD.
- **Claude Code (plugin author)** — built TDP Plugins marketplace; AI-assisted development workflow systems.

### Soft

- Technical leadership.
- Architectural decision-making.
- English communication (TOEIC 970, working with SG / AU markets).

## 5. Domains worked

- **Banking** — loan management systems, SME lending.
- **Finance** — workflow digitization, document generation.
- **Real Estate** — ERP.
- **B2B eCommerce, inventory** (early-career, AppCore).
- **Markets:** Singapore (primary, current), Australia (early-career), Vietnam.

## 6. The artifacts (the three main, plus smaller)

### 6.1 Document Engine *(Redoc, 2024–2025; npm-published 2025)*

- **What:** Tiptap/ProseMirror-based rich-text editor system for enterprise document workflows. Replaces CKEditor.
- **Architecture:** Decoupled. Framework-agnostic core + Angular wrapper, both published as npm packages.
- **Business framing:** Eliminates third-party licensing fees, gives client technological autonomy, supports business-specific features like dynamic fields (`{{customer_name}}`, `{{loan_amount}}`) for Letter of Offer flows.
- **Demo:** <https://document-engine.thunderphong.com/>
- **Repo:** <https://github.com/phuong-tran-redoc/document-engine>
- **npm:** `@phuong-tran-redoc/document-engine-core`, `@phuong-tran-redoc/document-engine-angular`
- **Outcome cited:** part of the workflow change that achieved 60% reduction in client working time.
- **Portfolio role:** **Lead case study, first-among-equals in the gallery.**

### 6.2 Portfolio Monorepo *(personal, 2026, ongoing)*

- **What:** This Nx monorepo. Includes API (NestJS + DDD + Prisma), Console product (Angular signals + SSR), Landing site (Angular), shared libraries (types, utils, ui, api-client).
- **Tech:** Angular 21, NestJS 11, Nx 22, Postgres, Tailwind, custom design system.
- **Discipline visible:** TDD, DDD, design bank in `.context/design/`, error pattern library, component bank, context patterns, agent integrations.
- **Honest scope:** the console product is small (CRUD-class). The interesting thing is everything around it: the design system, the patterns, the testing rigor, the documentation system.
- **Repo:** local; this monorepo.
- **Portfolio role:** **Second case study.** Demonstrates end-to-end ownership including the visual side that the day job does not include.

### 6.3 TDP Plugins for Claude Code *(personal, 2026)*

- **What:** Claude Code plugin marketplace. Task-driven development workflow: project setup, vision, architecture, epic breakdown, task tracking, progress, TDD support.
- **Honest framing (locked):** *"an AI workflow system I built for myself"* — not "harness engineering" (term too narrow), not "plugin marketplace" (term too commercial). Built for the author and team; the very tool used to plan and ship the portfolio you're reading.
- **Repo:** <https://github.com/tdp1999/claude-code-ctx>
- **Portfolio role:** **Third case study.** Closes the loop: site reader can click into the meta-tool that built the site.

### 6.4 Smaller artifacts (one-line mention only)

- **Arch Studio** — Angular 17 + Nx Standalone solution to a FrontendMentor advanced challenge. Demo: <https://thunderphuong-arch-studio.vercel.app>. Repo: <https://github.com/phuong-tran-1999/arch-studio>.
- **Legacy portfolio** — Angular 14 + Tailwind, with dark/light mode and language switching. Live at <https://thunderphong.com/>. Repo: <https://github.com/tdp1999/porfolio> (note typo in repo name). **This is the site being replaced by the v1 of this initiative.**

## 7. Working style — observations from session

These are not labels for the person; they are observations useful for copy/UX decisions. Updated as more is observed.

- **Self-aware about second-guessing.** Course-corrects own framings; says "second guessing" out loud. Implication: copy/draft work should expect iteration; lock late, not early.
- **Pragmatic over polish.** Calls own console "CRUD" without flinching. Anti-"tự cao". Implication: copy must avoid over-claiming; small-scope honesty (Procida 8+9) earns trust.
- **Systems thinker.** Three substantive artifacts in three different domains all share the same shape — patterns down before code, system before feature. This is the strongest through-line.
- **Cares about authenticity.** Independently aligned with Procida's twelve rules before being shown them. Hates AI-generic and template-clone sites viscerally. Implication: never optimize copy toward "professional" if it costs voice.
- **Mixes humility with concrete pride.** "Có gì để mất đâu chứ" coexists with deliberate investment (Claude Max, 3 months on this monorepo). Implication: voice should hold both — neither corporate confidence nor self-deprecation.
- **Engaged but tires under heavy decision-stacking.** Long planning turns end with "đợi mình suy nghĩ". Implication: when an epic accumulates 6+ open questions, surface only the top 3 and defer the rest.
- **Decisive once persuaded.** Will lock decisions cleanly when the reasoning lands. Implication: present trade-offs explicitly; do not hedge.
- **Identity tension noted (now resolved):** initially framed self as "5 years implementing other people's designs", which CV evidence contradicts (engineering ownership, library leadership, architectural foundations all there). The honest narrow framing is: visual/UX design ownership is new; engineering ownership is not. Locked in E1.

## 8. Voice samples — direct quotes (Vietnamese)

For E2 to preserve in English drafts. Goal: the spirit, not literal translation.

- *"AI có thẩm mỹ tốt hơn mình, nhưng câu chuyện là của mình."* — north-star sentiment.
- *"Mình có gì để mất đâu chứ."* — frames risk-taking as low-stakes; humble bravery.
- *"Biết sao được."* — accepts uncertainty pragmatically; recurring tic.
- *"Đây chỉ là cái internal site, CRUD thôi mà, có gì khó đâu."* — honest small-scope dismissal of the console product.
- *"Mình sẽ show cái này cho 3 người bạn sau khi xem xong (cả 3 đều là nữ, có mắt thẩm mỹ tốt hơn mình)."* — admits aesthetic deference; sets the friend-test as personal success metric.
- *"Mình thích công việc của mình chứ, mình cũng đã build nhiều thứ đáng tự hào trong công việc chính."* — direct day-job pride. Anchors the no-resentment rule.
- *"Mình ghét một portfolio site: quá tự cao, không nhận thức được điều mình làm, ai cũng có thể làm được."* — primary anti-pattern.
- *"Cảm giác mãn nguyện thôi."* — success metric framed as feeling, not number.

Tone signature: short sentences with parenthetical clarifications, mixed VN+EN tech terms, willing to admit not-knowing without performance ("hơi khó nói", "cũng khó nói", "đợi mình suy nghĩ"). EN drafts should not become more polished than this — that would erase the voice.

## 9. Aesthetic — what is liked, what is hated

### Liked

- **Railway.com** — rail/track scroll concept. Liked the metaphor.
- **Sharon's portfolio** (cited as "ổn") — *"Hello! I'm Sharon. 👋 A multidisciplinary developer and designer (sometimes)..."* — voice-rich, the "(sometimes)" is honest scope without apologizing.
- **Franco Ruiz portfolio** — *"Staff Frontend Engineer focused on architecture, systems, and scale."* — specialist density, no story arc, photo-led.
- **Parth portfolio** — typographic-monolith hero (giant name as the visual moment).
- **Small SVG hover interactions** — subtle visual reward without distraction.
- **Bold typography** — willing to commit to a single hero typeface as the visual moment.

### Hated

- **Self-aggrandizing portfolios** that don't acknowledge "ai cũng làm được".
- **AI-generated template aesthetic** — Vercel/Claude landing clones with gradient-mesh hero, oversized rounded cards, and the standard About → Skills → Projects → Contact section sequence. Specifically cited: <https://portfolio-katey.vercel.app/>.
- **Scroll-triggered content reveal** that makes the reader wait for animation before being able to read.
- **Mờ / hard-to-read / over-effect.**
- **Skill bars and badge grids** with progress indicators or star ratings.
- **Body-shop staff-augmentation agencies** (the recruiter/employment model, not a visual; affects negative-persona filtering).
- **Gambling industry** — silent exclusion.

## 10. Life context & goals

- **Career goals (current period):** open to better full-time roles, ideally remote-friendly with international/Western teams. Also seeking ~14h/week (≈ 2h/day, evenings) of freelance or 2nd-job work to accelerate income growth.
- **Life goals tied to this initiative:** higher income; remote / hybrid working arrangement.
- **Investment context:** purchased Claude Max plan at $100/month — meaningful spend, treated as an investment in both this initiative and ongoing engineering velocity.
- **Time horizon:** no hard deadline. "Làm tốt nhất có thể." Quality > speed. Risk identified in initiative R1: scope creep without deadline.

## 11. Constraints & non-negotiables

- **Currently employed at Redoc.** Site must read as "good Senior, open to opportunities", not "looking to leave a bad situation". No language that disrespects the day job.
- **English-first ship.** VN parking-lot. Architecture must support cheap VN add-on.
- **No maintenance commitment.** Site must not depend on cadence to feel alive.
- **No body-shop / gambling / unfamiliar-stack-without-comp work.** Filter via vibe and absent cues, not explicit lists.
- **TOEIC 970 + Valedictorian:** subtle surface (about / colophon) only. Not hero, not stat-flex.
- **Friend test = visual >> projects >> content.** Visual budget gets prioritized when E4/E5 trade off.

## 12. Reference points

### Articles / sources the author values

- **Daniele Procida — *Twelve Rules for Job Applications and Interviews*** — <https://vurt.eu/articles/twelve-rules/>. Treated as the spiritual constitution of this initiative. Each rule mapped in the initiative file.

### Portfolios cited as references

- **Liked (with caveats):** Parth (typographic), Sharon (voice + "(sometimes)"), Franco Ruiz (specialist density), Railway.com (scroll metaphor).
- **Disliked (anti-references):** portfolio-katey.vercel.app (AI-template look). Generic Vercel/Claude-landing clones broadly.

### Adjacent tools cited (for context, not to copy)

- **claudekit.cc** — adjacent to the author's TDP Plugins; cited as "similar tool I glanced at briefly".

## 13. Source map

Where each fact in this file came from, for traceability.

- **CV** (`assets/current-cv.pdf`): identity, employment timeline, accomplishments, tech list, education, certifications, listed projects.
- **Conversation (this initiative's planning sessions)**: working style observations, voice samples, aesthetic preferences, anti-patterns, friend test, hated examples, life context, goal framing.
- **Repos inspected:** `phuong-tran-redoc/document-engine`, `tdp1999/claude-code-ctx`.
- **Live URLs verified (existence only):** thunderphong.com, document-engine.thunderphong.com, github profiles.

## 14. Open data gaps

Things this databank does not yet know. Add as they get answered.

- Salary band targeted (rough number) — useful for negative-persona filter sharpness.
- Exact freelance rate the author has in mind, if any.
- Specific company-size sweet spot beyond "any if professional" — some sub-epic may want this.
- Whether the author has a usable headshot photo (Franco-style hero option depends on this).
- Whether the author wants to surface the legacy portfolio (`thunderphong.com`) anywhere or fully replace its URL.
- Color preferences / brand-personal palette starting points (E4 territory, but a hint here would help).
- Any prior writing — blog posts, conference talks, internal docs that could anchor a "writing" surface — to consider for a future "writings" section (parking-lot v2+ unless surfaced).

## 15. Change log

- 2026-05-01 — Databank created. Synthesized from CV, three planning sessions, and repo inspection of Document Engine + claude-code-ctx. E1 outputs depend on this; E2 will write directly from it.
- 2026-05-01 — Senior-title duration corrected: ~1 year, not the full 3.5 years at Redoc. Note added that copy should lean on years-shipping over years-at-title.
