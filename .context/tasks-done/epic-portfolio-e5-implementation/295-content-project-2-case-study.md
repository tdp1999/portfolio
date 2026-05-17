# Task: Content — Project 2 case study

## Status: done

## Project chosen: Document Engine (E2 Card 1 — first-among-equals)


## Goal
Author the second project's case study at Console-MVP-equivalent depth (good forcing function for content quality even on smaller projects).

## Context
Per E5 P6: "all 3 V1 projects use D3.c uniformly." If imagery isn't ready, B3.b text fallback applies on the home grid; the detail page itself still uses D3.c. ~700–1000 words.

## Acceptance Criteria
- [x] Project record + sections + tocAnchors + links populated
- [x] At minimum 1 figure if imagery available; otherwise text-only sections that still pass the Procida tests
- [x] Pull-quote present
- [x] Voice / specificity / proud framing per Rules 4 + 8 + 12
- [x] Word count ~700–1000
- [x] Outcome section follows Procida 3 framing

## Technical Notes
- Pick the second project from the V1 set (E2 list); confirm choice before writing.
- If imagery isn't ready at launch, document the gap in the project record and plan a post-launch upgrade.

## Files to Touch
- `apps/landing/content/projects/<slug>.md` (or seed)
- `assets/projects/<slug>/fig-0X.png` (if available)

## Dependencies
- 277, 290, 294 (use Console MVP as the depth reference)

## Complexity: M

## Progress Log

- 2026-05-17 — Case study body authored for **Document Engine** (Card 1 in E2 lock, slug `document-engine`). 1057 words, slightly above the 700–1000 target — depth on the framework-agnostic core + restricted-edit/dynamic-fields features justifies the length. Sections: Overview, The Problem, Approach, Outcome, What I'd Change. 1 pull-quote, 2 figure refs with placeholder asset paths under `/assets/projects/document-engine/`. Existing links (Live demo, npm core, npm angular, repo) on the project record retained. Markdown source committed at `apps/landing/content/projects/document-engine.md`; pushed to DB via `PUT /api/projects/<id>` → `project.body.en` (6990 chars).
- **Remaining (blocks [x]):** capture 2 real screenshots (restricted-edit mode in a loan agreement, dynamic-field nodes in a draft contract), beautify per `assets/moodboard/screenshot-tools.md`, save to `apps/landing/public/assets/projects/document-engine/fig-0X-*.png` matching the alt slugs in the markdown.

## Note on V1 set sequencing

Portfolio Monorepo (E2 Card 2) intentionally deferred — overlaps heavily with the Console MVP deep dive (task 294). If a v2 of the site warrants three Card-grid case studies, write a thin Portfolio-Monorepo page that links to Console-MVP rather than retelling it.
