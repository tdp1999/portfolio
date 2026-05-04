# Task: Home stack (Section 5 — The Stack)

## Status: pending

## Goal
Render **§5 The Stack** of the home layout: Tier 1 situated prose (3 short paragraphs from `Profile.stackIntro`) above Tier 2 grouped pills (skills bucketed under 6 umbrella groups).

## Context
Identified as a P4 gap on 2026-05-04 during task 282 — E2 §9 layout master locks 9 home sections including The Stack between Bio Card Grid (§3 / task 284) and The Story (§6 / task 282), but the original P4 task list (281–287) skipped a dedicated `home-stack` task. This task fills that gap.

Replaces the `<landing-home-section-placeholder label="The Stack">` slot temporarily reserved in `feature-home.html` by task 282.

## Acceptance Criteria
- [ ] Tier 1 — situated prose:
  - Pulls `Profile.stackIntro` (translatable JSONB) from API; renders the 3 paragraphs Owner authors in Console (E2 §4 LOCKED copy as v1 content)
  - Bold convention: `**phrase**` in source → `<strong>` at render (technology names per E2 §4)
  - Italic convention: `*phrase*` if/when used
  - Container: same ~680px reading column as `home-intro` for consistency, OR opt for a slightly wider column if voice-led prose feels cramped (decide during build, document in progress log)
- [ ] Tier 2 — grouped pills:
  - 6 umbrella groups from the seeded `Skill` umbrellas (`languages`, `frontend`, `library-work`, `backend`, `tooling`, `workflow-and-ai`); render group label + member chips per group
  - Pulls skills from public Skill API; chips use `<landing-chip>` (mono caps, hairline border, no fill)
  - Group labels use `<landing-eyebrow>` styling (mono caps slate)
  - Layout: vertical stack of group rows on mobile; consider 2-column or grid on desktop if it reads better — verify against Parth-style reference in moodboard
- [ ] Section eyebrow `§ 05 · THE STACK` at top of column (matches `home-intro` convention)
- [ ] Quiet section per B2.c (no rule lift); whitespace separates from §4 above and §6 below
- [ ] No hardcoded prose, no hardcoded skill names — all from API
- [ ] OnPush, signal inputs, standalone

## Technical Notes
- **No new schema needed.** `Profile.stackIntro` already exists (added in migration `20260503024829_portfolio_landing_fields`); seed already populates EN copy with `**bold**` markers.
- Skill umbrellas already seeded (see `apps/api/prisma/seed.ts` `UMBRELLA_SKILLS`); member skills attach via `parentSkillId`. Confirm public Skill query exposes the umbrella → member relationship; if not, surface that as a sub-task before starting render.
- Reuse the inline-emphasis parse pattern from `home-intro.component.ts` (`*phrase*` for italic). Add a sibling parse for `**phrase**` → `<strong>`. Consider promoting both into a shared `parseInlineEmphasis()` util in `feature-home/src/lib/shared/` if a third section needs it (don't extract pre-emptively per CLAUDE.md).
- This is the place where bold gets introduced — formalize the bold convention in E5 epic's content authoring rule when this task lands.
- Don't preempt the philosophy strip (task 285) or projects gallery (task 283) tone — Stack is breadth signal, not opinion zone.

## Files to Touch
- `libs/landing/feature-home/src/lib/stack/home-stack.component.{ts,html,scss}`
- `libs/landing/feature-home/src/lib/feature-home/feature-home.{ts,html}` (replace `§5` placeholder with `<landing-home-stack/>`)
- `libs/landing/shared/data-access/src/lib/skill.*` (add public skill query if missing — sub-task)
- Possibly `libs/landing/feature-home/src/lib/shared/parse-inline-emphasis.ts` (only if extraction earns its keep; otherwise inline)

## Dependencies
- 274 (tokens), 278 (chip primitive), 279 (eyebrow primitive)
- 277 (Profile.stackIntro via API — done)
- 277b (Console form for stackIntro — done)
- Confirm: public Skill API exposes umbrella grouping (may need a small BE task first)

## Complexity: M

## Progress Log
