# Task: Radar quick-only analysis by default, and console polish from the first production use

## Status: done

## Goal
Every post gets only the quick analysis unless the Owner ticks "Deep analysis" on a run, and five console rough spots the Owner hit on production are fixed.

## Context
From ADR-036 (production acceptance, task 424, 2026-10-08). In a 17-post Auto run the quick pass sent 9 posts to deep analysis, deep lowered 6 of them, cost 85% of the run and made the analysis step take 14 minutes. The Owner decided: quick analysis scores and filters every post; deep research on a post happens in a conversation with Claude Code; the pipeline's deep pass stays available as an opt-in. The UI items come from the Owner's first real use of the console.

## Acceptance Criteria
- [x] A run stores a `deepAnalysis` flag, false by default. When it is false the server runs only the quick analysis for the run's posts, and the quick prompt drops the line that a high score earns a deep analysis.
- [x] When `deepAnalysis` is true the current behaviour holds (deep for quick scores from `RADAR_AI_DEEP_MIN_SCORE`, at most `RADAR_AI_DEEP_MAX` per run).
- [x] The New run dialog and the Re-analyze dialog each have a "Deep analysis" checkbox, unchecked by default, sent with the request.
- [x] Feed: the "Deep" / "Quick" text under the score is gone; a post analyzed deep shows a multicolour (gradient) border around its score, with an accessible label. Rows are shorter (less padding/height) so more fit in the table view, on the 4px grid.
- [x] Workflow profile opens as a dialog from the Feed instead of the `/radar/profile` page; the old route is removed or redirects.
- [x] Item Detail, AI analysis section: each part (summary, overview, key terms, image notes, apply to my workflow, sources, ...) is clearly separated (section headings, spacing, dividers) per the console cookbook.
- [x] Sources dialog and Upload dialog have a Cancel button. Closing with no change does not reload the Feed; it reloads only after an upload, a source toggle or another change.
- [x] Guide (`radar-feature-guide`) updated for quick-only default, the checkbox, the profile dialog, the deep indicator, the provider dot and the Model filter.
- [x] If the quick analysis call fails for a post, the post becomes stuck as today (no silent fallback to deep).
- [x] Feed: a dot before the score marks the provider that analyzed the post (blue Gemini, orange Claude, muted other); the score tooltip is one short line, depth and model id ("Quick · gemini-3.1-flash-lite"). A Model filter in the Filters panel narrows the Feed by `producerModel`, its options are every model that has analyzed a post, and it rides on the URL (`?model=`). (Owner request, 2026-10-08)

## Technical Notes
- Server: `infrastructure/llm/server-ai.adapter.ts` (`deepCandidates` returns none when the run's flag is off), `application/radar-analyzer.ts` / `prompts/radar-analysis.prompt.ts` (`deepMinScore: null` when off), `run.create.command.ts`, re-analysis command (task 425), DTOs and presenter.
- Migration: add `deepAnalysis Boolean @default(false)` to `radar_runs`; the Owner runs `prisma migrate dev`. Existing runs read as off.
- Console: `radar-run.create.dialog`, `radar-item.reanalyze-dialog`, `radar-item.list` (score cell, row density, sources dialog close), `radar-source.dialog`, `radar-profile.form` (to a dialog), `radar-item.detail-card` (AI analysis section), `_radar-score.scss`.
- Read `.context/design/cookbook/console.md` before the SCSS; typography tokens only; no template method calls.

**Specialized Skill:** be-test, for the run flag and the adapter's deep selection.
**Specialized Skill:** prisma-migrate, for the `deepAnalysis` column.

## Files to Touch
- apps/api/prisma/schema.prisma
- apps/api/src/modules/radar/infrastructure/llm/server-ai.adapter.ts
- apps/api/src/modules/radar/application/radar-analyzer.ts
- apps/api/src/modules/radar/application/commands/run.create.command.ts
- apps/api/src/modules/radar/application/radar.dto.ts
- libs/console/feature-radar/src/lib/radar-run.create.dialog/
- libs/console/feature-radar/src/lib/radar-item.reanalyze-dialog/
- libs/console/feature-radar/src/lib/radar-item.list/
- libs/console/feature-radar/src/lib/radar-source.dialog/
- libs/console/feature-radar/src/lib/radar-profile.form/
- libs/console/feature-radar/src/lib/radar-item.detail-card/
- .context/guides/radar-feature-guide.html

## Dependencies
- 424 (done)

## Complexity: M

## Progress Log
- 2026-10-08 Started.
- 2026-10-08 Server flag done (schema, DTO refines, entity, adapter `deepCandidates` only when on, light prompt drops the deep line when off); 273 radar unit tests pass. Migration not created yet (Owner runs it).
- 2026-10-08 Console: Deep analysis checkboxes, rainbow ring on deep scores, 44px rows, profile dialog (old route redirects), Sources dialog Cancel/Done with reload only on change, AI analysis parts under rules with an Overview label. The shared `.rv-section__body:has(.rv-fold)` 8px gap was what ran the analysis parts together.
- 2026-10-08 Owner added: provider dot + Model filter + shorter score tooltips. Feed summary now carries `producerAdapter`/`producerModel`; list response carries `producerModels`.
- 2026-10-08 Migration `20261008085807_20261008_radar_run_deep_analysis` applied by the Owner (add column, default false; 14 local runs read off).
- 2026-10-08 Using be-test: adapter skips deep when off and drops the deep line from the light prompt (mutation-checked), tells the threshold when on; CreateRunSchema and ReanalyzeItemsSchema refuse deep outside Auto; repository filters by `producerModel` and lists models once, sorted. 6 new tests.
- 2026-10-08 Local Playwright check: rows 44px, 4 deep rings, provider dots, tooltip "Deep · gemini-3.8-flash", Model filter narrows to 4 rows with chip and `?model=`, Sources Cancel/Escape do not reload, profile dialog Escape closes clean and asks when dirty, `/radar/profile` lands on the Feed, AI analysis shows 5 ruled parts. `nx build console` passes.
- 2026-10-08 Done: all ACs satisfied.
- 2026-10-08 Pre-commit review fixes: the `?model=` check now matches the API (any 1 to 100 characters, so `claude-opus-4-6[1m]` survives a reload); tests that `deepAnalysis: true` reaches a created run, a re-analysis run, the adapter call and a saved-then-read run; the Feed route has `unsavedChangesGuard` again (only an open, dirty profile dialog holds it; the dialog opens with `closeOnNavigation: false` so Back does not close it before the guard asks) plus a beforeunload warning, and the Feed closes the dialog when the guard lets it go; series colour tokens replace the hex literals; the shared record-view rule packs only an all-fold section to 8px, so the radar `::ng-deep` overrides are gone; the Detail quick-analysis note has its own sentence; Escape a widget already handled does not close the profile dialog.
- 2026-10-08 Migration `20261008092959_20261008_radar_enrichment_model_index`: index on `radar_enrichments.producerModel` (the Model filter options) and a backfill that sets `deepAnalysis` on AUTO runs still in flight at deploy, which ran deep before ADR-036.
