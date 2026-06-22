# Task: Content authoring — master checklist (all surfaces, EN + VI, small → large)

## Status: in-progress

## Goal

Single source of truth for every piece of human-authored content. Author writes one item at a time; this file tracks WORDS, not code. Sub-tasks (340/341/328/323) stay the detailed briefs — this sits above them as the index.

## Where content lives (IMPORTANT)

- **PROD is the source of truth.** All real content is authored on prod (via Console / prod files). The **local DB seed is demo/throwaway** — do NOT treat local seed content as "done". A `[draft]` tag below only means "a starting draft exists in seed to crib from", not that the surface is finished.
- **Canonical home:** once a piece is finalized (in the author's own voice), record it into `plans/epic-portfolio-e0-author-databank.md` as the canonical "databank chính chủ", then ship to prod.

## Authoring workflow

Two modes per item:

1. **Solo** — author writes directly on prod.
2. **Assisted** — author hands a draft + relevant E0 context to Claude → Claude edits wording/grammar, advises on structure/voice (**author keeps final decision**) → finalized text goes into E0 databank → author publishes on prod.

Claude maintains this checklist: when the author reports an item done, Claude ticks the box (EN and/or VI) and logs it.

## Claude's role (collaboration contract)

When working content sessions on this task, Claude acts as:

1. **Editor / proofreader** — refine, dedupe, fix spelling & grammar, proofread, and improve the wording the author writes. Preserve the author's voice (E0 §8); do not over-polish into AI-generic.
2. **Task operator / progress tracker** — help operate the checklist: tick boxes, mark items done, keep the Progress Log current, surface what's next.
3. **Critical second opinion** — stand outside the author's head as a recruiter / landing-page visitor / skeptical reader and push back on claims. Provide critical thinking and a second opinion so the author avoids one-sided thinking, over-claiming ("tự cao"), or under-selling ("tự ti"). Author keeps final decision.
4. **Locator / general guide** — find where each piece of content lives (component, template, DB field, file path) and give general how-to guidance for editing it.

### Per-item analysis frame

Author treats every field as deliberate, not filler. For each item, before/while drafting, work through:

1. **Purpose** — what job does this field do for the reader (which audience, what moment in their read, what action it should provoke)?
2. **How to write it** — register, length, structure that fits that purpose and the E0/E1 voice.
3. **What to include** — the specific information/ideas that belong in it (and what to leave out).

## Voice source

Write from E0 (`plans/epic-portfolio-e0-author-databank.md`) — identity, timeline, artifacts, **§8 voice samples**. Positioning/audience locked in E1.

## Status legend

`[blank]` no words anywhere · `[draft]` starting draft exists in seed · `[in-code]` string locked in a component/template, needs final wording (decide: keep-in-code vs move to DB).
Each prose item carries two checkboxes: **EN** and **VI**. Language-neutral items (tokens, alt text) marked `(neutral)` — one box.

---

## Tier 0 — Micro (token → one line)

- EN [x] · VI [x] — About CTA (/about §04 Next steps heading+lede) · **DONE 2026-06-13**, canonical in E0 §16 (`Profile.ctaHeading`/`ctaLede`) (T340)
- [] (neutral) — **Skill taxonomy**: 21 leaves under 6 umbrellas + tier/category/isLibrary. **LOCKED 2026-06-13, canonical in E0 §16.** Remaining: enter on prod via Console (`/skills`); React→/now; capabilities + Angular-native features (Signals, SSR)→stackIntro prose; AI=one "Claude Code" chip.
- EN [] · VI [] — `Skill.proficiencyNote` × N ("why default-reach", 1 line). **DEFERRED**: only surface was the depth-map, which is now hidden; home stack chips don't render it. Revisit when a surface consumes it. · `[draft]` (T340)
- EN [] · VI [] — Footer link labels (5 pages) — E2 §7 · `[draft]`
- [] (neutral) — `Profile.coreStack`: 3–4 hero chips (`TYPESCRIPT / ANGULAR / SSR`) · `[blank]`
- EN [] · VI [] — `Profile.footerTagline`: one-line footer tagline · `[blank]`
- EN [] · VI [] — `Skill.description` × 16 (optional; skip unless wanted) · `[blank]`
- EN [] · VI [] — PWA manifest `name` / `short_name` / `description` (T324) · `[blank]`
- EN [] · VI [] — 404 / not-found page copy (`pages/not-found/`) · `[in-code]`

## Tier 1 — Short prose (1–3 sentences)

- EN [] · VI [] — `Profile.selectedWorkIntro`: intro for Selected Work · `[blank]`
- EN [] · VI [] — `Profile.contactIntro`: intro for /contact hero · `[blank]`
- EN [] · VI [] — About hero H1: one sentence ≤18 words (who–does what–for whom) · `[draft: aboutHeading]` (T340)
- EN [] · VI [] — About hero sub-paragraph: 2–3 sentences (~30–50 words) · `[draft: aboutLede]` (T340)
- EN [] · VI [] — Home Get-in-touch copy + 3 CTA labels (Hire/Freelance/Hi) · `[in-code]` `libs/landing/feature-home/src/lib/home.get-in-touch/home.get-in-touch.ts:20-40`
- EN [] · VI [] — Home Bio-card bridge: 2–3 sentences hero ↔ gallery (E2 §6) · `[draft]`
- EN [] · VI [] — `Profile.tagline` / `Profile.stackIntro`: review draft · `[draft]`
- EN [] · VI [] — Contact page microcopy (~40 strings: hero "Let's talk", form labels, success, globe caption) · `[in-code]` `apps/landing/src/app/pages/contact/contact.{ts,html}`

## Tier 2 — Medium (paragraph / multi-item)

- EN [] · VI [] — Home 90s story arc: ~450 words; **flagged "too literary", rewrite** (E2 line 104) · `[draft, rewrite]`
- EN [] · VI [] — About manifesto: 5–7 principles (bold claim + 2–3 sentence expansion) · `[draft ×5]` (T340)
- EN [] · VI [] — About failures: 3 essays ~150 words (context→decision→consequence→lesson) · `[draft ×3]` (T340)
- EN [] · VI [] — Experience highlights audit: rewrite verb-scope-metric, 3 roles · `[draft]` (T340)
- EN [] · VI [] — `/now`: ~300–500 words, Derek-Sivers snapshot, monthly refresh · `[blank]` (T328, needs re-spec markdown→console)
- EN [] · VI [] — `/uses`: gear/tools (hardware, editor, AI tools) · `[blank]`
- EN [] · VI [] — `/colophon`: "how this site was made" · `[blank]` (deferred, E2 line 324)
- EN [] · VI [] — Privacy Policy (`pages/legal/privacy.html`) · `[in-code]`
- EN [] · VI [] — Terms (`pages/legal/terms.html`) · `[in-code]`
- EN [] · VI [] — Contact email templates: auto-reply to sender + notification (`ddl/email-templates/`) · `[draft]`
- EN [] — `llms.txt`: summary + bio + per-project pitch + section links (English-only by spec) · `[blank]` (T323)

## Tier 3 — Long-form

- EN [] · VI [] — Project case studies, 5 missing `.md`: `permissions-console`, `block-editor`, `loan-ops-dashboard`, `design-bank`, `contract-compare` · `[blank]`
- EN [] · VI [] — Project case studies, 3 existing (`document-engine`, `console-mvp`, `tdp-plugins`), review voice · `[draft]`
- EN [] · VI [] — Blog posts: 13 in seed are scaffold/AI — replace with author's own (or treat as drafts to rewrite) · `[draft]`
- EN [] · VI [] — Blog posts: new, ongoing via Console RTE · `[blank]`
- EN [] · VI [] — CV / resume content (if downloadable CV is in scope per E1 channel map) · `[blank]`

## Cross-cutting (per-surface, easy to forget)

- EN [] · VI [] — Per-page SEO meta (metaTitle / metaDescription / OG) for projects, about, contact, blog, /now, /uses — beyond Profile home meta · `[blank]`
- [] (neutral) — Image alt text for media (avatar, OG, project gallery) — a11y + content · `[blank]`

## Dependencies (technical gates)

- Long-form with multi-block content (images + lightbox) in case studies / blog: gated on RTE epic (`redoc-rte`, 305–319) + Prose Block Renderer (`redoc-blocks`).

## Related

- `tasks/340-about-content-authoring.md` · `tasks/341-about-bilingual-vi-translation.md` · `tasks/328-landing-now-page.md` · `tasks/323-landing-llms-txt.md` · `tasks/324-landing-pwa-manifest-and-icons.md`
- `plans/epic-portfolio-e2-content-scaffolding.md` · `plans/epic-portfolio-about.md` · `plans/epic-portfolio-e0-author-databank.md`

## Progress Log

- 2026-06-13: Built console **skill reorder** tool (drag-drop, grouped by tier) to fix displayOrder pain. New `PATCH /skills/reorder` (mirrors Experience reorder) + `/skills/reorder` route + `skill.reorder` component (CDK drag-drop, within-tier only, optimistic). displayOrder now per-tier (0-based index within tier). Both API + console builds clean. Follow-ups (optional): handler unit test; sort skills LIST by (tier, displayOrder); cross-tier drag = change tier (v2).
- 2026-06-13: Item #2 (skill taxonomy) locked → E0 §16. 23 leaves/6 umbrellas, chips=tools-only, dropped capabilities+PM tools+Adobe XD, React→/now, AI=one Claude Code chip. proficiencyNote deferred (no live surface). Pending prod Console entry.
- 2026-06-13: Item #1 (Tier 0 — About §04 CTA heading+lede) locked EN+VI → E0 §16. Added per-item analysis frame to collaboration contract.
- 2026-06-13: Recorded Claude's collaboration contract (editor/proofreader · task operator · critical second opinion · locator/guide). Confirmed CV content already synthesized into E0 §3/§4/§13 (raw PDF not in repo).
- 2026-06-07: Created as master index (task 361). Prod = source of truth; local seed throwaway. Workflow: solo or assisted→finalize into E0. Full EN+VI tracking. Added missed surfaces: legal (privacy/terms), 404, email templates, PWA strings, per-page SEO meta, alt text, CV.
