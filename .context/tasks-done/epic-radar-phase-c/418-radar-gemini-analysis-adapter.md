# Task: Gemini analysis adapter and AUTO run flow

## Status: done

## Goal
An `AUTO` run analyzes every item with Gemini inside the API and reaches `done` with no Claude Code session.

## Context
From `epic-radar-phase-c`. This is the task that replaces the `/radar work` skill for analysis. Today `ExternalWorkerAdapter` parks the step at `awaiting-external`; the new `gemini` adapter does the work in-process, one structured request per item, with Google Search grounding for research and URL context for links. The app stays a pipeline (AI-001): the state machine owns the steps, tools only fill one item's enrichment.

## Acceptance Criteria
- [x] `RadarRunFlow` gains `AUTO`; creating an `AUTO` run is refused with a named error while `GEMINI_API_KEY` is missing.
- [x] A `gemini` `ILlmProvider` takes a small batch of pending items per cron tick and, per item, sends one request with text, own and shared images (Cloudinary URLs), fetched comments, the workflow profile (as the system prefix) and the item's links.
- [x] The analysis rules move from `.claude/skills/radar/references/enrichment-guide.md` into the API as the canonical prompt (e.g. `radar/application/prompts/`); the skill's guide points to it.
- [x] The answer is validated with `radar-enrichment.schema.ts` and stored through the same path as the worker submit, with `producer = { adapter: 'gemini', model }`.
- [x] If validation fails, the adapter retries once with the validation error attached; if it fails again the item is marked failed with the reason and the run continues (app code decides the retry, never the model).
- [x] If Gemini rate-limits (429), the item stays pending and the run picks it up on a later tick; the run does not fail.
- [x] Links: Facebook links are dropped before the call (RAD-003); URL context retrieval status per URL and grounding source URLs are kept in the usage trace, and the enrichment gains a `sources` list.
- [x] Tools are sent only with limits (AI-002); a fact check with no source is never stored as `major`.
- [x] Each run has a budget (`budgetMicroUsd`, default from config); once the run's recorded spend reaches it, the run stops starting AI calls and leaves the rest pending (RAD-007).
- [x] The external worker path keeps working unchanged (fallback, no longer the default).

## Technical Notes
- **Run flows (agreed 2026-10-07).** A flow says how much the Owner does by hand:
  `MANUAL` = Owner uploads the Apify export and runs `/radar work`; `HYBRID` = API calls Apify, Owner runs
  `/radar work`; `AUTO` = API calls Apify and Gemini analyzes, Owner only reads. `AUTO` sets capture
  adapter `apify` and `llmAdapter = 'server-ai'` itself (the adapter is provider-neutral; the provider name lands in `producer.adapter`); the Owner does not pick the two separately.
- Console work (Runs dialog AUTO + budget, run spend on the Runs page, `sources` on Detail) moved to
  task 418b.
- Spend per run = sum of the run's usage rows (on the free tier, the estimated list-price cost), so the budget works as a token cap even when nothing is billed.
- Keep batches small (memory, task 387): load one item's images as URLs, not bytes, unless Gemini needs inline data.
- Grounding with Google Search has its own free-tier daily quota; when it is exhausted, analyze without it and say so in the trace, do not fail the item.
- `sources` is a new nullable JSON column on `radar_enrichments` (shown on Detail in 418b).
- Update `.context/guides/radar-feature-guide.html` (flows, AUTO, budget) in the same task.

**Specialized Skill:** prisma-migrate — `AUTO` enum value, `budgetMicroUsd`, `sources`
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — retry rule, budget stop, 429 keeps pending, Facebook link drop, no `major` without source
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/radar/infrastructure/llm/server-ai.adapter.ts (new)
- apps/api/src/modules/radar/application/radar-analysis.config.ts, domain/policies/radar-analysis.policy.ts (new)
- apps/api/src/modules/ai/** (Interactions API, search pricing, ledger `group`)
- apps/api/src/modules/radar/application/prompts/** (new)
- apps/api/src/modules/radar/application/commands/run.advance.command.ts, run.create.command.ts
- apps/api/src/modules/radar/radar.module.ts
- apps/api/prisma/schema.prisma + migration
- .claude/skills/radar/references/enrichment-guide.md
- .context/guides/radar-feature-guide.html

## Dependencies
- 416 - AI module and ledger

## Complexity: L

## Progress Log
- 2026-10-07 Started. Decisions: flow `AUTO` (definition above), console part split into 418b.
- 2026-10-07 Probe (free-tier key, gemini-3.5-flash-lite): images as Cloudinary `fileData.fileUri` work (same 1,091 prompt tokens as inline bytes), so no image download is needed. `urlContext` + JSON schema works. `googleSearch` fails with 429 "exceeded your current quota" on every call, with or without a schema and on 3.8-flash too, with no retry delay: search grounding looks unavailable on this free key. Awaiting the Owner's decision on research without search.
- 2026-10-07 Probe across models (free tier). AI Studio: search grounding quota is 1.5K/day for Gemini 2 / 2.5 and 0 for Gemini 3; 2.5 models return 404 for new users. Image URL + urlContext + schema works on 3.1-flash-lite, 3.5-flash-lite, flash-lite-latest, 3.5-flash, 3.6-flash, 3-flash-preview (3.7/3.8-flash/flash-latest 503 at probe time). Search 429 on every Gemini 3 model. Gemma 4 26B: search works alone (2 queries), image + schema works, but search + schema ran 92 s and hit the 4,096 output cap with broken JSON; no urlContext on Gemma. Without search, Gemma judged a real 2026 post "fake" from its 2024 knowledge.
- 2026-10-07 Owner moved the key to the paid tier (prepay). Re-probe: every Gemini 3.x model now runs image + urlContext + schema and search; no 503. But `generateContent` with `responseJsonSchema` silently skips search (no grounding metadata, confident answer that contradicts the searched one). The Interactions API (`ai.interactions.create`, tools `google_search` + `url_context`, `response_format: { type: 'text', mime_type: 'application/json', schema }`) runs search AND returns valid schema JSON with real source URLs (search steps listed in `steps`). One run failed with 400 "Model generated too many tool calls" and passed on retry. Pricing (ai.google.dev/gemini-api/docs/pricing, checked 2026-10-07): search is billed per query the model runs, 5,000 free per month shared by all Gemini 3.x models, then $14 per 1,000; retrieved tokens are not billed. One probe ran 7 queries for one question, so search, not tokens, dominates cost.
- 2026-10-07 Owner chose "Interactions API + controlled search". Owner switched `AI_GEMINI_BILLING` to `paid` (needs an API restart; older ledger rows keep `billed=false`).
- 2026-10-07 AI module: `GeminiProvider` rewritten on the Interactions API (one request per item, `store: false`, `maxRetries: 0`). The port stays provider-neutral: tools are named `webSearch` / `readUrls`, results carry `searchQueries` and `complete`, `IAiClient` exposes `provider` and `spentMicroUsd(group)`. The ledger gains `searchQueries` and a `group` ref (`groupType`, `groupId`) so a run's spend is one indexed sum. Search is priced at list price ($14 per 1,000) with no free-tier deduction, so the figure is an upper bound. A 400 "too many tool calls" maps to `unavailable` (retryable).
- 2026-10-07 Radar: the adapter is named `server-ai` (not `gemini`) so another provider needs no Radar change; `producer = { adapter: ai.provider, model: <model that answered> }`. Model chain from `RADAR_AI_MODELS` (default 3.5-flash-lite, 3.1-flash-lite, 3.8-flash), search on unless `RADAR_AI_SEARCH=off`, at most 3 queries per item asked in the prompt, budget default `RADAR_AI_BUDGET_USD` or $0.50, batch 3 per tick. Failure handling: invalid answer retried once with the reason, then the item is stuck with `workError` (new column, cleared on requeue); busy (429/503/timeout/network) on every model releases the rest uncounted; auth or missing key rethrows so the step records an error. Budget reached ends the run with a warning, the rest stays pending. Rules moved to `application/prompts/radar-analysis.rules.ts`; the skill guide now only keeps worker-specific fields and tools. Feature guide updated (flows, server analysis, budget, `sources`). Split 418c (AI provider limits panel) off at the Owner's request.
- 2026-10-07 Outstanding: migration (Owner runs `migrate dev`), be-test specs for the new logic, a live AUTO run. The remaining ACs stay unticked until those land.
- 2026-10-07 Spend guard (Owner: money burned too fast). Measured: the local ledger held only $0.0002; the burn came from the direct probe scripts (not ledgered, up to 7 search queries per call). Estimated the first design at $0.04 to $0.06 per item (search about 70%), so about $10 per 200-item run. Owner chose: (1) two-tier analysis: light for every item (no search, no link reading, 3 images, short answer, feature `radar.analyze.light`), deep only for light score >= 7 and at most 15 per run (`RADAR_AI_DEEP_MIN_SCORE`, `RADAR_AI_DEEP_MAX`, 0 = off; search at most 2 queries, links, 8 images, feature `radar.analyze`); deep candidates are worked before new light claims; a failed deep keeps the light result and notes `workError`; enrichment gains `analysisDepth` (`light` | `deep`, null for the worker). (2) Flash-Lite only: `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `thinking_level: low` via a provider-neutral `AiLimits.effort`. (3) $0.50 per run plus a global daily cap in the AI client (`AI_DAILY_CAP_USD`, default $1, new error kind `over-budget`, call refused before sending, run stops with a warning). The state machine now ends ANALYZE only on an `idle` tick, so the deep work opened by the last light batch still runs.
- 2026-10-07 Prod: 123 items with an enrichment but PENDING. Upload does not touch `workStatus` (`contentOf` in radar-capture.repository.ts); the v3 requeue migration put every v2 enrichment back to PENDING on purpose. Owner chose to let AUTO re-analyze them (they reach a run only when its window re-captures them).
- 2026-10-07 Owner: Flash-Lite is not trusted for fact checks and grounded reasoning. Model chain and thinking level are now per tier: light `gemini-3.1-flash-lite` → `gemini-3.5-flash-lite`, effort low (`RADAR_AI_LIGHT_MODELS`); deep `gemini-3.8-flash` → `gemini-3.5-flash`, effort medium (`RADAR_AI_DEEP_MODELS`).
- 2026-10-07 Default run budget raised to $1 (Owner). Daily cap stays $1 (`AI_DAILY_CAP_USD`), so it is the binding limit for a single big run.
- 2026-10-07 be-test specs written: server-ai.adapter.spec (12: light store, retry then fail, model hand-over, all busy releases uncounted, permanent failure, auth rethrow, deep first + deep failure keeps light, deep cap, budget before claim and mid-batch, daily cap, idle), radar-analysis.policy.spec (blocked URLs, strip, severity), radar-analysis.prompt.spec (no FB URL, commenter names, image cap, light vs deep preamble), AUTO tests in run.advance (working/idle/finish, budget stop) and run.create (no key, budget default/asked, Hybrid none, schema budget only on AUTO), ai-cost search fee, ai-client daily cap. Radar + AI: 44 suites, 253 tests pass; tsc clean (api app + spec, console feature-ai, console shared util).
- 2026-10-07 Outstanding: the `analysis_depth` migration is created but not applied (the store path writes `analysisDepth`, so the storing AC stays open until it is applied and the integration specs rerun).
- 2026-10-07 Both migrations applied. Live AUTO run on local (10 posts from 2026-10-03, budget $0.30): 6 PENDING items got the light pass (`gemini-3.1-flash-lite`, about $0.0024 each, 5 s), 2 scored >= 7 and got the deep pass (`gemini-3.8-flash`, 2 search queries each, about $0.048 each, 44 s, 4 and 2 sources); the deep pass lowered both scores to 6 and 5. The other 4 already held a DONE worker enrichment and were not re-analyzed (re-capture keeps `workStatus`). Run total $0.11, all items DONE, no `workError`, producer `{ gemini, <model> }`, `analysisDepth` stored.
- 2026-10-07 Done: all ACs satisfied.
- 2026-10-07 Pre-commit review fixes: an AUTO run whose provider stays busy for 30 minutes with no item analyzed now stops with a warning (it waited forever before; in-memory per run, reset by any analyzed item); the light prompt quotes the configured deep threshold (`RADAR_AI_DEEP_MIN_SCORE`, none when the deep pass is off) instead of a fixed 7; Gemini file parts are sent by mime type (video, audio, PDF), not always as images; `GeminiProvider.generate` mapping covered by specs; budget range $0.01 to $100 shared by API and console (`RADAR_{MIN,MAX}_RUN_BUDGET_USD`).
