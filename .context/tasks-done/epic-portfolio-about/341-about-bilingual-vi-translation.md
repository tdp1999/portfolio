# Task: VI translation pass for all `/about` content

## Status: superseded (archived 2026-07-27) — split across tasks 361 / 388 / 342

> This task assumed a separate, later VI pass over a finished EN page. That is not how the content
> track actually runs: in task 361 **every field is locked EN+VI in the same session** (see its
> Progress Log — `bioShort`, `tagline`, `contactIntro`, `bioLong`, `/document-engine` A1), so a
> trailing translation sweep has nothing left to own. Its three concerns are now owned as follows:
>
> | Concern | Owner |
> | ------- | ----- |
> | Per-field VI copy for `/about` surfaces (hero, manifesto, failures, CTA, highlights) | **Task 361** — every item carries an EN box and a VI box; canonical text in E0 §16 |
> | Static UI copy that exists only in English (inline labels, buttons, hints, aria-labels) | **Task 388** Phase 2 — audits every EN/VI pair across all of landing and proposes VI for EN-only strings, with the author as the HITL gate |
> | Locale switcher actually working on `/about` | **Task 342** (done) — `about.spec.ts` asserts EN→VI changes hero H1, first manifesto principle, failures heading, and document title |

## Goal
Ensure every text surface on `/about` has a Vietnamese translation matching the tone and structure of the English version. Sweep through hero, manifesto, failures essays, CTA, and any inline labels.

## Context
Per epic, About is bilingual (EN + VI) consistent with rest of landing. EN is written first (default for technical depth in author's preference); VI follows. Some technical content (manifesto, failures) may need careful translation to preserve stance without sounding stiff.

## Acceptance Criteria

> Disposition at close (2026-07-27) in brackets.

- [ ] Hero H1 + sub-paragraph: VI version reviewed for stance preservation (not literal translation if literal sounds awkward) — *[DONE 2026-07-06 EN+VI; VI of `aboutLede` has an open prod bug, tracked as A1 in 361]*
- [ ] Manifesto principles: VI version of all 5-7 principles — each claim + expansion. Reviewed for tone preservation. — *[not written in either language; 361 Tier 2]*
- [ ] Failures essays: VI version of all 3 essays (~~`apps/landing/src/content/failures/vi/{1,2,3}.md`~~ — path stale, console-managed since task 345) — *[not written in either language; 361 Tier 2]*
- [ ] Depth-map rationale: VI for each Daily-tier `Skill.proficiencyNote` — *[dropped with the depth-map section, 2026-05-22]*
- [ ] Experience highlights: VI for all `Experience.highlights[]` entries — *[not written; 361 Tier 2, and prod has 0 Experience records]*
- [ ] CTA copy + any other inline labels: VI version — *[CTA done 2026-06-13; inline labels → task 388]*
- [ ] Locale switcher works correctly on `/about` — switching EN↔VI updates every section without missing fallback — *[covered by `about.spec.ts`, task 342]*
- [ ] No untranslated string leaks through (sweep with locale=vi, scroll the entire page) — *[→ task 388 Phase 2, which sweeps all of landing, not just `/about`]*
- [ ] Type-check + landing prod build clean — *[standing guardrail; task 388 Phase 4 carries it]*

## Technical Notes
- Translation discipline: stance-driven content (manifesto, failures) is NOT a literal translation. Translate the *idea* into native Vietnamese; check with a fluent reader if available.
- Avoid clichéd VI tech-speak ("đam mê", "tận tâm") — same trap as the EN anti-patterns.
- Inline labels (e.g., "Read my story", "Get in touch", "Day-to-day", section headings) — audit during this pass.
- If a translation lag persists for a specific section, hero or manifesto can fall back to EN (per task 332 AC), but failures section should NOT show EN to VI viewers (essays are too prose-heavy to leak — block the section render if VI missing, or graceful 1-line "VI translation coming soon").

## Files to Touch

> **STALE — do not follow.** Tasks 343/344/345 moved hero / principles / failures to console-managed DB
> records; `apps/landing/src/content/` does not exist. Content VI is edited in Console next to its EN
> field; static UI VI lands in the single JSON source that task 388 is building.

## Dependencies
- ~~340 (EN content authored — translation comes after)~~ — both closed 2026-07-27; the EN-then-VI sequencing never held in practice.

## Complexity: S

## Progress Log

- 2026-07-27: **Closed as superseded.** Overlap audit against task 361: the per-field VI tracking here is duplicated by 361's dual EN/VI checkboxes, the EN-first premise contradicts the actual practice of locking both languages per field in one session, and the only genuinely distinct ACs were verification rather than authoring — the locale switcher (already asserted in `about.spec.ts`, task 342) and the untranslated-string sweep (now a landing-wide concern in task 388 Phase 2). Disposition noted per AC above; Files to Touch marked stale. Docs-only.
