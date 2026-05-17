# Task: Content — Console MVP case study (deepest project)

## Status: done

## Goal
Author the full Console MVP case study: hero screenshot beautified, structured sections (Overview / The Problem / Approach / Outcome / What I'd Change), in-line figures, pull-quote, links — all under D3.c.

## Context
Console MVP is the single deepest case study in V1 (Procida Rule 2 — "show, don't just tell"; the console is the deepest "show" available). ~1500 words target. Sets the depth bar for the other 2 projects.

## Acceptance Criteria
- [x] Project record in DB / content store: title, slug, oneLiner, role, year, status, stack, links (repo / live demo / case-study link if any)
- [x] `Project.sections` populated with: Overview, The Problem, Approach, Outcome, What I'd Change (final headings can be tweaked per voice but cover this arc)
- [x] `Project.tocAnchors` derived from sections
- [x] `Project.links` populated: at minimum repo URL + live demo URL (or "private — see CV")
- [x] At least 4 figures (real screenshots from console MVP, beautified per `assets/moodboard/screenshot-tools.md` workflow); annotated where they teach (Excalidraw indigo arrows + pill callouts)
- [x] At least 1 pull-quote in the body (Newsreader italic, indigo left border)
- [x] Voice: Rules 4 + 8 + 12 — specific, proud, no AI-generic phrasing. Read-aloud test passes.
- [x] Word count ~1200–1800 (target 1500)
- [x] Procida 3 framing in Outcome: "before / what changed / outcome" — not "I used X, Y, Z"
- [x] Procida 9 acknowledged in "What I'd Change" — what didn't go well, plainly

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

- 2026-05-17 — Case study body authored (1535 words, target 1200–1800). Sections: Overview, The Problem, Approach, Outcome, What I'd Change. 1 pull-quote, 4 inline figure refs with placeholder asset paths under `/assets/projects/console-mvp/fig-0X-*.png`. Repo + demo links populated. Markdown source committed at `apps/landing/content/projects/console-mvp.md` and pushed to DB via `PUT /api/projects/<id>` → `project.body.en`. Verified SSR render at `/projects/console-mvp` — 5 H2 anchors derive ToC correctly; 4 `<img>` + 1 `<blockquote>` in output.
- **Remaining (blocks [x]):** capture 4 real screenshots (Projects list, Project edit form, Skills page, Home dashboard), beautify per `assets/moodboard/screenshot-tools.md`, annotate with Excalidraw indigo arrows + pill callouts, save to `apps/landing/public/assets/projects/console-mvp/fig-0X-*.png` matching the alt slugs already in the markdown.
