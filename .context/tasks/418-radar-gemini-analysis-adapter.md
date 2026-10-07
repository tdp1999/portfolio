# Task: Gemini analysis adapter and AUTO run flow

## Status: pending

## Goal
An `AUTO` run analyzes every item with Gemini inside the API and reaches `done` with no Claude Code session.

## Context
From `epic-radar-phase-c`. This is the task that replaces the `/radar work` skill for analysis. Today `ExternalWorkerAdapter` parks the step at `awaiting-external`; the new `gemini` adapter does the work in-process, one structured request per item, with Google Search grounding for research and URL context for links. The app stays a pipeline (AI-001): the state machine owns the steps, tools only fill one item's enrichment.

## Acceptance Criteria
- [ ] `RadarRunFlow` gains `AUTO`; creating an `AUTO` run is refused with a named error while `GEMINI_API_KEY` is missing.
- [ ] A `gemini` `ILlmProvider` takes a small batch of pending items per cron tick and, per item, sends one request with text, own and shared images (Cloudinary URLs), fetched comments, the workflow profile (as the system prefix) and the item's links.
- [ ] The analysis rules move from `.claude/skills/radar/references/enrichment-guide.md` into the API as the canonical prompt (e.g. `radar/application/prompts/`); the skill's guide points to it.
- [ ] The answer is validated with `radar-enrichment.schema.ts` and stored through the same path as the worker submit, with `producer = { adapter: 'gemini', model }`.
- [ ] If validation fails, the adapter retries once with the validation error attached; if it fails again the item is marked failed with the reason and the run continues (app code decides the retry, never the model).
- [ ] If Gemini rate-limits (429), the item stays pending and the run picks it up on a later tick; the run does not fail.
- [ ] Links: Facebook links are dropped before the call (RAD-003); URL context retrieval status per URL and grounding source URLs are kept in the usage trace, and the enrichment gains a `sources` list.
- [ ] Tools are sent only with limits (AI-002); a fact check with no source is never stored as `major`.
- [ ] Each run has a budget (`budgetMicroUsd`, default from config); once the run's recorded spend reaches it, the run stops starting AI calls and leaves the rest pending (RAD-007).
- [ ] The Runs dialog offers the `AUTO` flow and a budget field; the run's spend shows on the Runs page.
- [ ] The external worker path keeps working unchanged (fallback, no longer the default).

## Technical Notes
- Spend per run = sum of the run's usage rows (on the free tier, the estimated list-price cost), so the budget works as a token cap even when nothing is billed.
- Keep batches small (memory, task 387): load one item's images as URLs, not bytes, unless Gemini needs inline data.
- Grounding with Google Search has its own free-tier daily quota; when it is exhausted, analyze without it and say so in the trace, do not fail the item.
- `sources` is a new nullable JSON column on `radar_enrichments`; show it in the Detail page's AI analysis section as a short list of links.
- Update `.context/guides/radar-feature-guide.html` (flows, AUTO, budget) in the same task.

**Specialized Skill:** prisma-migrate — `AUTO` enum value, `budgetMicroUsd`, `sources`
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — retry rule, budget stop, 429 keeps pending, Facebook link drop, no `major` without source
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/infrastructure/llm/gemini.adapter.ts (new)
- apps/api/src/modules/radar/application/prompts/** (new)
- apps/api/src/modules/radar/application/commands/run.advance.command.ts, run.create.command.ts
- apps/api/src/modules/radar/radar.module.ts
- apps/api/prisma/schema.prisma + migration
- libs/console/feature-radar/src/lib/radar-run.list/** (dialog: AUTO + budget, spend)
- libs/console/feature-radar/src/lib/radar-item.record/** (sources)
- .claude/skills/radar/references/enrichment-guide.md
- .context/guides/radar-feature-guide.html

## Dependencies
- 416 - AI module and ledger

## Complexity: L

## Progress Log
