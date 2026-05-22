# Task: Depth-map variants on `/ddl/about-signatures`

## Status: done (decision: dropped — depth map section removed from /about IA, won't graduate)

## Goal
Design and render 2-3 visual variants of the "depth map" signature element — a 3-tier (Daily / Frequent / Shipped) skill visualization with rationale per Daily-driver tool. Uses existing `Skill.tier` data; no BE changes.

## Context
Per epic, depth map replaces the traditional skill cloud / logo grid. Senior signal: shows depth vs breadth distinction with opinion ("why I reach for this first"). Data source: `SkillService.getSkillsByTier()` already returns tier-grouped skills. Each Daily-driver tool needs a 1-line rationale — audit `Skill.proficiencyNote` field (epic Q5); if empty, content authoring task (340) fills it.

## Acceptance Criteria
- [x] 2-3 visual variants rendered side-by-side under "1. Depth map" section in `/ddl/about-signatures`
- [x] Each variant uses real data from `SkillService.getSkillsByTier()` (DAILY / FREQUENT / SHIPPED tiers)
- [x] Variants should explore DISTINCT visual treatments — examples:
  - **V1 — Concentric rings:** SVG 3 concentric rings, Daily inner with icon+name+rationale, Frequent middle as labeled chips, Shipped outer as small labels
  - **V2 — Tiered grid:** Three labeled rows (Daily / Frequent / Shipped), Daily row larger with rationale below each chip, Frequent + Shipped as compact chip rows
  - **V3 — Constellation:** Daily tools as anchored "stars" with rationale callouts; Frequent + Shipped clustered around in smaller type
- [x] Each variant labeled "Variant 1 / Variant 2 / Variant 3" with a 1-line description of the visual idea
- [x] Each variant renders icons via `LandingIconComponent` / `ChipComponent` (or skill `iconUrl` from `PublicSkill.iconUrl`)
- [x] If `Skill.proficiencyNote` is empty for Daily tools, render placeholder "(rationale TBD)" — author fills in task 340
- [~] EN + VI locale render correctly (proficiencyNote is translatable) — **task spec mismatch:** `Skill.proficiencyNote` is `String?` in Prisma + `string | null` in `PublicSkill`, NOT translatable. Variant renders the field as-stored; locale toggle does not change it. Flagged for epic Q5 follow-up.
- [ ] Type-check + landing prod build clean

## Technical Notes
- Variant components live as sub-components inside the DDL page directory (not shared yet). Promote to `feature-about` only when graduated (task 337).
- SVG for ring/constellation variants — keep math simple, use Tailwind for grid variant.
- Match landing typography scale (no `text-{2xs..5xl}` — use `text-display-*` / `text-body-*` / `text-mono-*` only per CLAUDE.md guardrail).
- Reuse `ChipComponent` for tier pills.
- Verify `proficiencyNote` is populated for Daily-tier skills via the API; if not, log in progress.

## Files to Touch
- DDL page sub-folder per variant: `ddl-about-signatures/depth-map-v1/`, `depth-map-v2/`, `depth-map-v3/`
- DDL page template (mount variants in section 1)

## Dependencies
- 333 (DDL scaffold)

## Complexity: M

## Progress Log
- 2026-05-22 Reassigned the variant numbering vs the AC examples (task ACs listed V1=rings, V2=grid, V3=constellation, but the order felt wrong for first-read clarity). Re-mapped to **V1 = Tiered grid**, **V2 = Concentric rings (SVG)**, **V3 = Constellation** — same three distinct treatments, just easiest-to-hardest left-to-right.
- 2026-05-22 Built three variants as sandbox sub-components under `apps/landing/src/app/pages/ddl/about-signatures/{depth-map-v1,depth-map-v2,depth-map-v3}/`. Each accepts `[groups]="tierGroups()"` (signal of `SkillTierGroup[]`) — page fetches once via `SkillService.getSkillsByTier()` and shares with all three. V1: grid with bordered Daily cards (icon + name + rationale) + chip wraps for Frequent/Shipped. V2: 600×600 SVG, three guide circles, tools placed evenly on each ring via `placeOnRing()` helper (start at 12 o'clock, `cos(angle)` thresholds drive text anchor so labels don't punch through the ring); Daily rationale lives in a stacked footnote so the ring stays legible at any count. V3: editorial constellation — Daily as anchored stars with rule + icon + name + rationale, Frequent as accent chip wrap, Shipped as quiet mono row separated by `·`. All three handle empty `proficiencyNote` with italic "(rationale TBD)" placeholder.
- 2026-05-22 Discovered task-spec mismatch: `proficiencyNote` is single-language (`String?` in Prisma → `string | null` on the public DTO). Task AC asserted it's translatable. Implementation renders the field as-stored; locale toggle doesn't affect it. Logged at AC level for epic Q5 follow-up.
- 2026-05-22 Wired the page: page-level `SkillService` injection + `tierGroups` signal, three depth-map cards in a `--stacked` variant row (variants are too rich for a 3-column grid), new `--filled` stage modifier drops the dashed-border placeholder treatment when a real component renders. Generic placeholder loop kept for §02 / §03 (tasks 335 / 336).
- 2026-05-22 **DECISION: drop depth map from `/about` entirely.** Review surfaced that all three variants duplicate the home §04 "The Stack" section — same `tierGroups` data, same chip-by-prominence rendering. A visitor scrolling `/` → `/about` would see the same skill chips twice. The "differentiator" supposed to be the per-Daily rationale, but `Skill.proficiencyNote` is `null` for nearly every skill today AND is single-language anyway. **Outcome:** depth map removed from epic IA + signature element list; task 337 will NOT graduate any depth-map variant; DDL sandbox kept as historical record (per "DDL pages stay after graduation"). Winner field on the page updated to "DROPPED — duplicates home §04 The Stack". Tasks 333 scaffold + 334 sandbox stay shipped as exploration record.