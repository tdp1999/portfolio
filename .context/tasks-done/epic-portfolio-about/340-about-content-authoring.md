# Task: Content authoring — hero, manifesto, failures, depth-map rationale, CTA, experience highlights audit

## Status: pending

## Goal
Author all content surfaces for `/about` per the writing brief in epic §"Content writing brief". This is an author-driven task (not implementation) and can run in parallel with build tasks.

## Context
Per epic, About content must be informative + opinionated + defensible. Every adjective paired with proof; no generic filler ("clean code", "users first", "passionate", "I worked too hard"). Six content surfaces need author input; this task captures all of them in one place so author can write in parallel with build tasks.

## Acceptance Criteria
- [ ] **Hero H1** (≤ 18 words): single sentence answering "who – does what – for whom". Pattern: "Senior software engineer building DDD-grade web platforms for fintech & SaaS teams." Drafted in EN + VI.
- [ ] **Hero sub-paragraph** (~30-50 words, 2-3 sentences): context for H1 — years, domain, current availability framing. EN + VI.
- [ ] **Manifesto principles** — 5-7 numbered, each with: bold one-line claim + 2-3 sentence expansion ("why I believe this"). Stance-driven. EN + VI.
- [ ] **Failures essays** — 3 × ~150 words. Each: anonymized context (year + domain) → specific bad decision → quantified consequence if possible → lesson applied since. Clinical tone. EN + VI.
- [ ] **Depth-map rationale** — 1 short line per Daily-tier tool (~10-15 words each). Why this tool is your default-reach. Audit `Skill.proficiencyNote` first; if populated, that's the source — review and rewrite weak entries via Console. EN + VI.
- [ ] **Experience highlights audit** — open each existing `Experience.highlights[]` entry; rewrite to verb-scope-metric formula: "Led migration to Nx monorepo (~12 apps, 40 libs) — cut CI time 18min → 4min." Drop any "worked on the frontend" / "helped the team" entries. EN + VI.
- [ ] **CTA copy** — single line. Pattern: "Hiring, partnering, or just curious? → /contact". EN + VI.

## Anti-patterns to flag during writing
- Manifesto: "Clean code matters", "users first", "ship fast", "I love writing code" — too generic.
- Failures: "I worked too hard", "I cared too much", "I'm too detail-oriented" — performative humility.
- Highlights: "Worked on the frontend", "Helped the team", "Contributed to" — no verb-scope-metric.
- Hero: "Hi, I'm Phương" / "Welcome to my portfolio" — not a positioning statement.

## Technical Notes
- Manifesto + CTA copy land in `AboutHowIThink` + `AboutCta` components as inline translatable strings (per epic Q1 default v1).
- Failures essays land in `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md` (per task 335 source convention).
- Hero copy lands in `AboutHero` component as inline translatable strings.
- Depth-map rationale lives in `Skill.proficiencyNote` (already a field on Skill entity) — author edits via Console.
- Experience highlights live in `Experience.highlights[]` translatable JSON — author edits via Console.

## Files to Touch
- `libs/landing/feature-about/src/lib/components/about-hero/about-hero.ts` (H1 + sub-paragraph strings)
- `libs/landing/feature-about/src/lib/components/about-how-i-think/about-how-i-think.ts` (principles array)
- `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md` (essays)
- Console (web UI) — edit Skill.proficiencyNote and Experience.highlights via existing forms
- `libs/landing/feature-about/src/lib/components/about-cta/about-cta.ts` (CTA copy)

## Dependencies
- None for writing the content; integration depends on tasks 330 (hero), 332 (manifesto), 335 (failures), 337 (signatures graduated), 338 (CTA mounted)

## Complexity: M (mostly thinking + writing time, low LOC)

## Progress Log
