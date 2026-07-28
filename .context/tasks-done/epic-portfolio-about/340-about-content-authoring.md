# Task: Content authoring — hero, manifesto, failures, depth-map rationale, CTA, experience highlights audit

## Status: superseded by task 361 (archived 2026-07-27)

> **Every live item on this brief now lives in `tasks/361-content-authoring-master.md`**, which tracks
> the same surfaces per-field with EN/VI checkboxes, prod-verified status, and the canonical text in
> E0 §16. This file is kept as the original writing brief — the anti-patterns and the formulas below
> are still the standard to write against — but **do not track status here, and do not follow the
> file paths in "Files to Touch"** (see the staleness note under Acceptance Criteria).
>
> Closed because: 3 of the 7 items are done, 1 was dropped from the page's IA on 2026-05-22, and the
> remaining 3 are tracked with more current context in 361 (all three read `0 records` on prod).

## Goal
Author all content surfaces for `/about` per the writing brief in epic §"Content writing brief". This is an author-driven task (not implementation) and can run in parallel with build tasks.

## Context
Per epic, About content must be informative + opinionated + defensible. Every adjective paired with proof; no generic filler ("clean code", "users first", "passionate", "I worked too hard"). Six content surfaces need author input; this task captures all of them in one place so author can write in parallel with build tasks.

## Acceptance Criteria

> **Disposition at close (2026-07-27).** Each item maps to a line in task 361; that line is the live one.

| Item | Where it lives now (task 361) | Status at close |
| ---- | ----------------------------- | --------------- |
| Hero H1 | Tier 1 · `Profile.aboutHeading` | **DONE** 2026-07-06 EN+VI, canonical E0 §16. Prod fix A2 applied 2026-07-26 (grammar + author's own VI wording kept) |
| Hero sub-paragraph | Tier 1 · `Profile.aboutLede` | **DONE** 2026-07-06 EN+VI, canonical E0 §16. Open prod bug **A1** in 361's audit table: the VI copy on prod is a half-finished draft leaking an editing note |
| Manifesto principles | Tier 2 · About manifesto | **Not written.** Prod returns 0 records → section renders "Principles coming soon." Storage is console-managed (task 344), not component strings |
| Failures essays | Tier 2 · About failures | **Not written.** Prod returns 0 records → "Field notes coming soon." Storage is console-managed (task 345), not markdown files |
| Depth-map rationale | Tier 0 · `Skill.proficiencyNote` | **Dropped.** The depth-map section was cut from the `/about` IA on 2026-05-22 (epic §IA + Q5) because it duplicated home §04 The Stack. `proficiencyNote` is DEFERRED in 361 — no surface consumes it |
| Experience highlights audit | Tier 2 · Experience highlights | **Not written.** Prod returns 0 Experience records → section renders "Career history coming soon." |
| CTA copy | Tier 0 · About CTA (`ctaHeading` / `ctaLede`) | **DONE** 2026-06-13 EN+VI, canonical E0 §16. Prod fix A4 applied 2026-07-26 (em-dash removed) |

### Original criteria (kept for the formulas + word counts)

- **Hero H1** (≤ 18 words): single sentence answering "who – does what – for whom". Pattern: "Senior software engineer building DDD-grade web platforms for fintech & SaaS teams." Drafted in EN + VI.
- **Hero sub-paragraph** (~30-50 words, 2-3 sentences): context for H1 — years, domain, current availability framing. EN + VI.
- **Manifesto principles** — 5-7 numbered, each with: bold one-line claim + 2-3 sentence expansion ("why I believe this"). Stance-driven. EN + VI.
- **Failures essays** — 3 × ~150 words. Each: anonymized context (year + domain) → specific bad decision → quantified consequence if possible → lesson applied since. Clinical tone. EN + VI.
- **Depth-map rationale** — 1 short line per Daily-tier tool (~10-15 words each). Why this tool is your default-reach. Audit `Skill.proficiencyNote` first; if populated, that's the source — review and rewrite weak entries via Console. EN + VI.
- **Experience highlights audit** — open each existing `Experience.highlights[]` entry; rewrite to verb-scope-metric formula: "Led migration to Nx monorepo (~12 apps, 40 libs) — cut CI time 18min → 4min." Drop any "worked on the frontend" / "helped the team" entries. EN + VI.
- **CTA copy** — single line. Pattern: "Hiring, partnering, or just curious? → /contact". EN + VI.

## Anti-patterns to flag during writing
- Manifesto: "Clean code matters", "users first", "ship fast", "I love writing code" — too generic.
- Failures: "I worked too hard", "I cared too much", "I'm too detail-oriented" — performative humility.
- Highlights: "Worked on the frontend", "Helped the team", "Contributed to" — no verb-scope-metric.
- Hero: "Hi, I'm Phương" / "Welcome to my portfolio" — not a positioning statement.

## Technical Notes

> **STALE — do not follow.** Tasks 343 / 344 / 345 (all done 2026-05-23/24) moved every one of these
> surfaces to **console-managed DB records**. The component-string and markdown-file plans below were
> the v1 default in epic Q1/Q2 and were reversed. `apps/landing/src/content/` does not exist.

- ~~Manifesto + CTA copy land in `AboutHowIThink` + `AboutCta` components as inline translatable strings (per epic Q1 default v1).~~ → `AboutPrinciple` module, edited in Console; `PRINCIPLES` const deleted in task 344.
- ~~Failures essays land in `apps/landing/src/content/failures/{en,vi}/{1,2,3}.md` (per task 335 source convention).~~ → `AboutFailure` module, edited in Console; `getFailureEssays()` retired in task 345.
- ~~Hero copy lands in `AboutHero` component as inline translatable strings.~~ → `Profile.aboutHeading` / `Profile.aboutLede`, edited in Console (task 343).
- Depth-map rationale lives in `Skill.proficiencyNote` (already a field on Skill entity) — author edits via Console. *(Surface dropped; field deferred.)*
- Experience highlights live in `Experience.highlights[]` translatable JSON — author edits via Console. *(Still accurate.)*

## Files to Touch

> **STALE — superseded by the console-managed migration above.** The real edit surface is Console, not
> the repo: Profile → Landing Content (hero + CTA), About → Principles, About → Failures, Experiences.

## Dependencies
- None for writing the content; integration depends on tasks 330 (hero), 332 (manifesto), 335 (failures), 337 (signatures graduated), 338 (CTA mounted) — all shipped.

## Complexity: M (mostly thinking + writing time, low LOC)

## Progress Log

- 2026-07-27: **Closed as superseded by task 361.** Overlap audit found every AC here duplicated in 361's per-field checklist, with 361 holding the newer state (prod-verified, canonical in E0 §16). Disposition table added above: 3 done (`aboutHeading`, `aboutLede`, About CTA), 1 dropped with the depth-map section (2026-05-22 IA decision), 3 still unwritten and tracked in 361 Tier 2. Also marked the Technical Notes + Files to Touch stale — they still pointed at inline component strings and `apps/landing/src/content/failures/**` (a path that does not exist) after tasks 343/344/345 moved these surfaces to console-managed DB records. No content authored; docs-only.
