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
| Personal site (legacy) | DELETED (2026-06). Old Angular 14 portfolio at `thunderphong.com` taken down — code removed, cannot be referenced. This initiative is its replacement. |
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
  - Note (author-confirmed 2026-06-27): the word **"harness"** is fine inside prose (e.g. `stackIntro` ¶3: "my own workflow and harness") — the lock above only rules out making *"harness engineering"* the **sole positioning label**, not the casual noun.
- **Repo:** <https://github.com/tdp1999/claude-code-ctx>
- **Portfolio role:** **Third case study.** Closes the loop: site reader can click into the meta-tool that built the site.

### 6.4 Smaller artifacts (one-line mention only)

- **Arch Studio** — Angular 17 + Nx Standalone solution to a FrontendMentor advanced challenge. Demo: <https://thunderphuong-arch-studio.vercel.app>. Repo: <https://github.com/phuong-tran-1999/arch-studio>.
- **Legacy portfolio** — Angular 14 + Tailwind, with dark/light mode and language switching. **DELETED (2026-06): site taken down and code removed; `thunderphong.com` no longer hosts it.** Cannot be linked or referenced anywhere on the new site. (Note: the Document Engine demo at `document-engine.thunderphong.com` is a separate subdomain and is unaffected.) This was the site replaced by v1 of this initiative.

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

### Locale & spelling conventions (author-confirmed 2026-06-13)

- **English copy = American English.** American spelling (`color`, `optimize`, `behavior`) and American idiom/register. Not British.
- **Vietnamese copy = pure Vietnamese**, *except* technical terms which stay in English (e.g. "frontend", "design system", "monorepo", "signals"). Do not force-translate established tech vocabulary into Vietnamese; do not let everyday words drift into Vietglish.

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

- Salary band targeted (rough number) — useful for negative-persona filter sharpness. **DEFERRED: author wants Claude to research a market-average reference number later, then decide.**
- Exact freelance rate the author has in mind, if any.
- Specific company-size sweet spot beyond "any if professional" — some sub-epic may want this.
- ~~Usable headshot photo?~~ **RESOLVED (2026-06-13): yes, a usable headshot exists. Franco-style photo-led hero is on the table.**
- ~~Surface the legacy portfolio?~~ **RESOLVED (2026-06-13): no — legacy site deleted, cannot reference. See §1 / §6.4.**
- Color preferences / brand-personal palette starting points (E4 territory, but a hint here would help).
- Any prior writing — blog posts, conference talks, internal docs that could anchor a "writing" surface — to consider for a future "writings" section (parking-lot v2+ unless surfaced).

## 15. Change log

- 2026-05-01 — Databank created. Synthesized from CV, three planning sessions, and repo inspection of Document Engine + claude-code-ctx. E1 outputs depend on this; E2 will write directly from it.
- 2026-05-01 — Senior-title duration corrected: ~1 year, not the full 3.5 years at Redoc. Note added that copy should lean on years-shipping over years-at-title.
- 2026-06-13 — Content-authoring session start. Added locale conventions (§8: EN=American, VI=pure-except-tech). Resolved §14 gaps: headshot exists; legacy portfolio deleted (updated §1, §6.4). Audience reach confirmed: write for broadest reach, intl recruiter top priority → domestic recruiter → freelance job hunter → curious dev. Salary-band research deferred to Claude.

## 16. Finalized copy (canonical — databank chính chủ)

Locked, author-approved strings. This is the source of truth; prod should match. Each entry notes the DB field + where to publish.

### /about — §04 "Next steps" CTA (`Profile.ctaHeading` + `Profile.ctaLede`)

Publish: Console → `/profile` → **Landing Content** section → "/about — §04 Next steps heading" + "…lede". Locked 2026-06-13.

- **Heading**
  - EN: *Still here? Then maybe we should talk.*
  - VI: *Bạn vẫn ở lại, chưa đi? Có hứng thú trò chuyện với mình không?*
- **Lede**
  - EN: *Whether you're hiring, partnering, or just here to say hi — reach out. I'd love to hear from you.*
  - VI: *Muốn tìm kiếm thành viên mới cho team, muốn hợp tác công việc, hay đơn giản là tò mò muốn trò chuyện một xíu với mình, bạn cứ liên hệ nha. Mình luôn sẵn lòng.*

### Skill taxonomy (canonical — Skill records)

Drives home §04 "The Stack" (chips grouped by `tier`; umbrellas excluded — `skill.util.ts:12`) + base data for project/blog skill tags. Locked 2026-06-13.

**Principles:** chip = recognizable **tool** token only. Capabilities (System Design, Responsive Design, OOP, RESTful API, State Management, Custom Extension Dev) AND **Angular-native features (Signals, SSR/hydration, standalone, complex reactive forms — part of Angular, not separate packages)** → live in `stackIntro` prose, NOT chips. The Angular depth (every version v8→v21, signals, SSR, forms) is the frontend story; it belongs in prose where it has room to impress, not scattered as thin feature-chips. Dropped: PM tools (Agile/Scrum, Jira, Trello, ClickUp), Adobe XD (sunset). **React** is OFF the stack (author still learning) → surface as a "currently learning" line on `/now`. **AI** = one chip "Claude Code" (tools-only rule); the "plugin author / built a harness" differentiation belongs in `stackIntro` prose + TDP case study (#3), not the chip.

Umbrellas (parents, not chips): Languages · Frontend · Library work · Backend · Tooling · Workflow & AI.

| Leaf | Parent | Category | Tier | isLibrary |
| --- | --- | --- | --- | --- |
| TypeScript | Languages | TECHNICAL | DAILY | no |
| JavaScript | Languages | TECHNICAL | DAILY | no |
| Angular | Frontend | TECHNICAL | DAILY | yes |
| SCSS | Frontend | TECHNICAL | DAILY | no |
| RxJS | Frontend | TECHNICAL | FREQUENT | yes |
| Angular Material | Frontend | TECHNICAL | FREQUENT | yes |
| Tailwind | Frontend | TECHNICAL | FREQUENT | yes |
| NgRx | Frontend | TECHNICAL | SHIPPED | yes |
| Tiptap / ProseMirror | Library work | TECHNICAL | FREQUENT | yes |
| NestJS | Backend | TECHNICAL | FREQUENT | yes |
| Node.js | Backend | TECHNICAL | FREQUENT | no |
| Prisma | Backend | TECHNICAL | FREQUENT | yes |
| Postgres | Backend | TECHNICAL | FREQUENT | no |
| Nx | Tooling | TOOLS | FREQUENT | yes |
| Jest | Tooling | TOOLS | FREQUENT | yes |
| Playwright | Tooling | TOOLS | FREQUENT | yes |
| Git | Tooling | TOOLS | DAILY | no |
| Postman | Tooling | TOOLS | FREQUENT | no |
| Figma | Tooling | TOOLS | FREQUENT | no |
| Cloudflare Pages | Tooling | TOOLS | SHIPPED | no |
| Claude Code | Workflow & AI | TOOLS | FREQUENT | no |

Confirmed 2026-06-13: keep Git/JavaScript/Node.js (ATS-recognizable tokens). Signals & SSR removed as chips (Angular-native features → prose). **21 leaves total.** Prod state: 6 umbrellas already exist; only the 21 leaves need entering. Watch item: FREQUENT bucket (now 14) — review when rendered live and rebalance to SHIPPED if heavy.

### Home hero — `Profile.coreStack` (3 chips)

Publish: Console → `/profile` → **Landing Content** → "Core stack chips" (comma-separated; rendered uppercase, joined ` / `). Locked 2026-06-27.

- **Chips:** `ANGULAR / TYPESCRIPT / NESTJS`

**Reasoning (locked):** A hero chip is a 3-second positioning keyword (eye + ATS), NOT a dependency graph — so explicit > implied (TypeScript stays even though Angular implies it; here it reads as "TS across the stack", the FE↔BE through-line). Chips place you in a category *honestly*; differentiation lives in `tagline` + `stackIntro` + case studies, so the strip carries no clever/rare token. Dropped from hero: **SSR** (author not strongly confident — honesty rule, E0 §7), **Tiptap/ProseMirror** (needs context to land → §5 + Document Engine case study), **SCSS** (supporting → §5), **Git/JS** (generic / subsumed). NestJS kept (author owns real backend work, E0 §3) with **Angular first** so positioning stays frontend-first. Considered but not added: 4th chip **Nx** (monorepo/architecture, systems-thinker signal) — held in reserve.

### Home hero — `Profile.tagline` (sub-line under the headline)

Publish: Console → `/profile` → **Landing Content** → "Tagline" (EN + VI). Rendered by `landing-home-hero`: split at the first sentence boundary → line 1 sans lead + line 2 Newsreader italic accent (`home.hero.ts` `taglineSplit`). Locked 2026-06-28. On prod.

**Structure:** sentence 1 = positioning claim (tenure + domain + market); sentence 2 (italic) = the proof that earns it — capability *areas*, not a padded list.

- **EN**
  - *Four years shipping fintech tools for the Singapore market. Permissions, loan flows, document processing — the core modules.*
- **VI**
  - *Bốn năm xây dựng sản phẩm fintech cho thị trường Singapore. Phân quyền người dùng, nghiệp vụ cho vay và xử lý văn bản, những module cốt lõi.*

**Reasoning (locked):** "Four years" attaches to the *fintech career* (since Jan 2022, ~4.5 yrs, rounded down — honest-conservative), distinct from §5's "five years writing code" (total coding) — two different counts, no contradiction. "tools" → VI **"sản phẩm fintech"**, NOT "công cụ tài chính" (the latter reads as *financial instruments*, a domain mistranslation). Line 2 names three *capability areas* (permissions / loan flows / document processing) instead of named products → kills the plural over-claim ("a document engine" → "document processing"). Tail **"core modules / module cốt lõi"** chosen over "load-bearing parts / phần chịu lực" (author preference: literal/technical over metaphor). VI uses a comma before the appositive tail, not an em-dash.

**Render dependency (RTE Phase 8 / task 317):** current `taglineSplit` auto-splits at the first period and does NOT parse Markdown — shipped now as plain prose (renders correctly under the current engine). When task 317 lands (drops `taglineSplit`, adds `MarkdownPipe`), the two-block split moves to author-controlled Markdown (blank-line paragraph break + `*italic*`). → tagline needs a one-time **re-mark** then: blank line before sentence 2 + wrap it in `*…*`.

### Home §05 "The Stack" — `Profile.stackIntro` (prose above the tier chip-grid)

Publish: Console → `/profile` → **Landing Content** → "Stack Intro" (markdown; `**bold**` = tech names, `*italic*` = Newsreader accent). Locked 2026-06-27. On prod.

**Structure (3 paragraphs):** ¶1 Angular depth (the journey small→large), ¶2 architectural judgment → bridge to NestJS (frontend-first, backend "when it serves my part"), ¶3 the AI differentiator (built own workflow/harness; the loop — this very site shipped with it). The §5 chip-grid below carries the tool enumeration, so the prose carries *narrative + judgment*, not a tool list.

- **EN**
  - ¶1: *Most of my five years writing code have been with **Angular**. I started at the smallest steps — slicing UI, building landing pages — and worked up to bigger ones: complex form modules in an ERP project, **Angular Material**, then hand-rolling my own components on **Material CDK**. These days I build libraries for Angular apps to reuse.*
  - ¶2: *That stretch of time — along with **Nx** — shaped how I approach code: scale first, an architecture that holds up under enterprise problems. Whether it's an Angular app or some other stack, I push myself to find the best pattern I know to keep a system scaling, and a design system right-sized for the problem. I also wanted to understand the backend properly — to work better with it and do my own part well. That's how I drifted into **NestJS**, a **Node.js** framework I genuinely like.*
  - ¶3: *And when AI arrived, it brought new energy — and anxieties I'd never felt before. I use **Claude Code** as a new tool, but I didn't stop at using it: I built my own workflow and harness on top, tailored to how my team and I actually work. It speeds me up, and it's also how I level myself up. The very site you're reading was planned, built, and shipped with it.*
- **VI**
  - ¶1: *Phần lớn hành trình viết code của mình, 5 năm, là làm việc với **Angular**. Mình đã đi từ những bước nhỏ nhất — cắt UI, làm landing page, cho đến những bước lớn hơn: phát triển các module form phức tạp trong dự án ERP, dùng **Angular Material** rồi tự viết component bằng **Material CDK**. Và hiện tại là viết library cho chính các app Angular tái sử dụng.*
  - ¶2: *Với khoảng thời gian không ngắn đó, cùng với **Nx**, chúng dần định hình cách mình tiếp cận với code: ưu tiên khả năng scale, kiến trúc vững cho bài toán doanh nghiệp. Dù là một app Angular hay một stack khác, mình luôn bắt bản thân tìm ra pattern tốt nhất trong tầm hiểu biết để hệ thống scale được, tìm design system đủ phù hợp để giải quyết vấn đề. Mình cũng muốn hiểu rõ phía Backend, để phối hợp tốt hơn và làm tròn phần việc của mình. Cũng vì vậy mà dần dà mình tìm hiểu và làm việc với **NestJS** — một framework **Node.js** mà mình thích.*
  - ¶3: *Và khi thời đại AI đến, nó cho mình nhiều động lực mới, cũng như tạo ra những lo âu chưa từng có. Mình dùng **Claude Code** như một công cụ mới, nhưng không chỉ dừng ở đó — mình có dựng một workflow và harness riêng, may đo cho cách mình và team làm việc. Nó vừa giúp mình tăng tốc, vừa là cách để mình nâng cấp năng lực. Site bạn đang đọc cũng được lên kế hoạch, xây dựng và ship bằng nó.*
