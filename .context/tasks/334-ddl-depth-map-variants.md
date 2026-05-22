# Task: Depth-map variants on `/ddl/about-signatures`

## Status: pending

## Goal
Design and render 2-3 visual variants of the "depth map" signature element — a 3-tier (Daily / Frequent / Shipped) skill visualization with rationale per Daily-driver tool. Uses existing `Skill.tier` data; no BE changes.

## Context
Per epic, depth map replaces the traditional skill cloud / logo grid. Senior signal: shows depth vs breadth distinction with opinion ("why I reach for this first"). Data source: `SkillService.getSkillsByTier()` already returns tier-grouped skills. Each Daily-driver tool needs a 1-line rationale — audit `Skill.proficiencyNote` field (epic Q5); if empty, content authoring task (340) fills it.

## Acceptance Criteria
- [ ] 2-3 visual variants rendered side-by-side under "1. Depth map" section in `/ddl/about-signatures`
- [ ] Each variant uses real data from `SkillService.getSkillsByTier()` (DAILY / FREQUENT / SHIPPED tiers)
- [ ] Variants should explore DISTINCT visual treatments — examples:
  - **V1 — Concentric rings:** SVG 3 concentric rings, Daily inner with icon+name+rationale, Frequent middle as labeled chips, Shipped outer as small labels
  - **V2 — Tiered grid:** Three labeled rows (Daily / Frequent / Shipped), Daily row larger with rationale below each chip, Frequent + Shipped as compact chip rows
  - **V3 — Constellation:** Daily tools as anchored "stars" with rationale callouts; Frequent + Shipped clustered around in smaller type
- [ ] Each variant labeled "Variant 1 / Variant 2 / Variant 3" with a 1-line description of the visual idea
- [ ] Each variant renders icons via `LandingIconComponent` / `ChipComponent` (or skill `iconUrl` from `PublicSkill.iconUrl`)
- [ ] If `Skill.proficiencyNote` is empty for Daily tools, render placeholder "(rationale TBD)" — author fills in task 340
- [ ] EN + VI locale render correctly (proficiencyNote is translatable)
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
