# Task: Home stack (Section 5 — The Stack)

## Status: done

## Goal
Render **§5 The Stack** of the home layout: Tier 1 situated prose (3 short paragraphs from `Profile.stackIntro`) above Tier 2 grouped pills (skills bucketed under 6 umbrella groups).

## Context
Identified as a P4 gap on 2026-05-04 during task 282 — E2 §9 layout master locks 9 home sections including The Stack between Bio Card Grid (§3 / task 284) and The Story (§6 / task 282), but the original P4 task list (281–287) skipped a dedicated `home-stack` task. This task fills that gap.

Replaces the `<landing-home-section-placeholder label="The Stack">` slot temporarily reserved in `feature-home.html` by task 282.

## Acceptance Criteria
- [x] Tier 1 — situated prose:
  - Pulls `Profile.stackIntro` (translatable JSONB) from API; renders the 3 paragraphs Owner authors in Console (E2 §4 LOCKED copy as v1 content)
  - Bold convention: `**phrase**` in source → `<strong>` at render (technology names per E2 §4)
  - Italic convention: `*phrase*` if/when used
  - Container: same ~680px reading column as `home-intro` for consistency, OR opt for a slightly wider column if voice-led prose feels cramped (decide during build, document in progress log)
- [x] Tier 2 — grouped pills:
  - 6 umbrella groups from the seeded `Skill` umbrellas (`languages`, `frontend`, `library-work`, `backend`, `tooling`, `workflow-and-ai`); render group label + member chips per group
  - Pulls skills from public Skill API; chips use `<landing-chip>` (mono caps, hairline border, no fill)
  - Group labels use `<landing-eyebrow>` styling (mono caps slate)
  - Layout: vertical stack of group rows on mobile; consider 2-column or grid on desktop if it reads better — verify against Parth-style reference in moodboard
- [x] Section eyebrow `§ 05 · THE STACK` at top of column (matches `home-intro` convention)
- [x] Quiet section per B2.c (no rule lift); whitespace separates from §4 above and §6 below
- [x] No hardcoded prose, no hardcoded skill names — all from API
- [x] OnPush, signal inputs, standalone

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
- 2026-05-08 Started — confirmed `/api/skills/all` is public (no auth) and returns the seeded umbrella `Skill` rows; `Skill.parentSkillId` carries the umbrella relation (no `displayGroup` field — schema uses parent/child instead). Added `SkillService` + `skill.types.ts` (umbrella slug union, `SkillGroup` shape) under `libs/landing/shared/data-access/`. Service groups skills under `UMBRELLA_SLUGS` and emits all 6 groups even when empty so future seeded members slot in without code changes.
- 2026-05-08 Built `HomeStackComponent` under `lib/stack/`. Tier 1: 680px column matching `home-intro` (consistency wins over a wider column — voice-led prose still reads fine), parses both `**bold**` and `*italic*` runs from `Profile.stackIntro`. Tier 2: vertical stack of populated groups on mobile, 2-col grid on ≥768px. Empty groups (no members yet) are filtered out at render. Eyebrow `[05, The Stack]` matches §6 intro convention. Quiet B2.c: no rule lift, only whitespace.
- 2026-05-08 Wired `<landing-home-stack>` into `feature-home.html` replacing the §5 placeholder. `feature-home.ts` injects `SkillService` and exposes `skillGroups` via `toSignal`. Type check clean. Done — all ACs satisfied.
