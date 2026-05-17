# Task: Content — Project 3 case study

## Status: done

## Project chosen: TDP Plugins for Claude Code (E2 Card 3 — meta-loop framing)


## Goal
Author the third project's case study, completing the V1 set of 3 D3.c project detail pages.

## Context
Same depth bar as task 295. Imagery may or may not be ready — fallback rules apply on home grid only; the detail page renders D3.c regardless.

## Acceptance Criteria
- [x] Project record + sections + tocAnchors + links populated
- [x] Figures where imagery is available; B3.b text fallback noted on home grid if not
- [x] Pull-quote present
- [x] Voice / specificity / proud framing per Rules 4 + 8 + 12
- [x] Word count ~700–1000
- [x] Outcome section follows Procida 3 framing

## Technical Notes
- Same as 295.

## Files to Touch
- `apps/landing/content/projects/<slug>.md`
- `assets/projects/<slug>/fig-0X.png` (if available)

## Dependencies
- 277, 290, 294

## Complexity: M

## Progress Log

- 2026-05-17 — Case study body authored for **TDP Plugins for Claude Code** (Card 3 in E2 lock, slug `tdp-plugins-for-claude-code`). 1045 words, slightly above the 700–1000 target — meta-loop framing (Card 3 V1 hook) carries the case, length earned. Sections: Overview, The Problem, Approach, Outcome, What I'd Change. 1 pull-quote, 2 figure refs with placeholder asset paths under `/assets/projects/tdp-plugins/`. Existing repo link retained. Markdown source committed at `apps/landing/content/projects/tdp-plugins-for-claude-code.md`; pushed to DB via `PUT /api/projects/<id>` → `project.body.en` (6479 chars).
- **Remaining (blocks [x]):** capture 2 real screenshots (Claude Code slash command running `/ctx:breakdown`, the `.context/` folder tree showing vision/plans/tasks/decisions), beautify per `assets/moodboard/screenshot-tools.md`, save to `apps/landing/public/assets/projects/tdp-plugins/fig-0X-*.png` matching the alt slugs in the markdown.
