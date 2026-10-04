# Task: Radar — synthesize step and Brief page

## Status: pending

## Goal
Produce a catch-up brief for a time window and show it in the console.

## Context
Epic `epic-radar-ai-news` (Phase B). Bridges the Owner's one-year gap: a single page of what changed per provider, new terms and a timeline.

## Acceptance Criteria
- [ ] The Owner requests a brief for a window from the console; the API creates a pending synthesize job.
- [ ] `/radar work brief` claims it, reads the window's enrichments, and submits one `RadarBrief` (markdown) grouped by provider and topic.
- [ ] The brief lists new terms with the date of the first item that mentions each, and links every claim to its source item.
- [ ] The Brief page lists briefs newest first and renders one as markdown with links to item Detail pages.
- [ ] If the window contains no enriched items, then the API refuses the request with a message instead of creating an empty brief.

## Technical Notes
- Reuse the claim/lease mechanism from 404 with a `SYNTHESIZE` step kind.
- Large windows: the skill summarizes per month first, then merges, to stay within one session.

## Files to Touch
- apps/api/src/modules/radar/application/commands/brief.*.command.ts
- apps/api/src/modules/radar/presentation/*.controller.ts
- libs/console/feature-radar/src/lib/radar.brief/**
- .claude/skills/radar/SKILL.md

## Dependencies
- 404, 405, 407

## Complexity: M

## Progress Log
