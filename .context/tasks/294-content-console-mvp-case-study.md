# Task: Content — Console MVP case study (deepest project)

## Status: pending

## Goal
Author the full Console MVP case study: hero screenshot beautified, structured sections (Overview / The Problem / Approach / Outcome / What I'd Change), in-line figures, pull-quote, links — all under D3.c.

## Context
Console MVP is the single deepest case study in V1 (Procida Rule 2 — "show, don't just tell"; the console is the deepest "show" available). ~1500 words target. Sets the depth bar for the other 2 projects.

## Acceptance Criteria
- [ ] Project record in DB / content store: title, slug, oneLiner, role, year, status, stack, links (repo / live demo / case-study link if any)
- [ ] `Project.sections` populated with: Overview, The Problem, Approach, Outcome, What I'd Change (final headings can be tweaked per voice but cover this arc)
- [ ] `Project.tocAnchors` derived from sections
- [ ] `Project.links` populated: at minimum repo URL + live demo URL (or "private — see CV")
- [ ] At least 4 figures (real screenshots from console MVP, beautified per `assets/moodboard/screenshot-tools.md` workflow); annotated where they teach (Excalidraw indigo arrows + pill callouts)
- [ ] At least 1 pull-quote in the body (Newsreader italic, indigo left border)
- [ ] Voice: Rules 4 + 8 + 12 — specific, proud, no AI-generic phrasing. Read-aloud test passes.
- [ ] Word count ~1200–1800 (target 1500)
- [ ] Procida 3 framing in Outcome: "before / what changed / outcome" — not "I used X, Y, Z"
- [ ] Procida 9 acknowledged in "What I'd Change" — what didn't go well, plainly

## Technical Notes
- Author against the final D3.c schema (Project.sections shape from migration M4).
- Content store strategy decided at start of P6 — likely Markdown in repo (`apps/landing/content/projects/console-mvp.md`); fallback is direct seed entry.
- Beautified screenshots saved to `assets/projects/console-mvp/fig-0X.png`.
- Re-read Voice section of `vision.md` and the E1 personal-feedback notes before writing.

## Files to Touch
- `apps/landing/content/projects/console-mvp.md` (or `apps/api/prisma/seed-data/projects/console-mvp.ts`)
- `assets/projects/console-mvp/fig-01..0X.png`

## Dependencies
- 277 (schema), 290 (page renders the data)

## Complexity: L

## Progress Log
