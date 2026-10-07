# Task: AI module with Gemini client, price constants and usage ledger

## Status: done

## Goal
A small `ai` module in the API that sends one Gemini request and records every call (tokens, cost, trace) in a usage ledger.

## Context
From `epic-radar-phase-c`. Foundation for every other Phase C task: Radar's Gemini adapter, transcripts and the brief all call AI through this module, and the AI integration screen (417) reads its ledger. Keep it the simplest version: one provider (Gemini), prices as a code constant (not a table), the call trace as JSON on the usage row. The Owner starts on the Gemini **free tier**, so rate limits (429) are normal, not exceptional.

## Acceptance Criteria
- [x] `apps/api/src/modules/ai/` exists with a port `IAiClient.generateStructured({ model, system, parts, schema, feature, refs, tools?, limits? })` returning `{ data, usage, trace }`, and a Gemini implementation on `@google/genai`.
- [x] When a call succeeds, the API stores one `AiUsageRecord` (provider, model, feature, status, input / output / cached / tool tokens, cost in micro-USD, latency, ref type + id, trace JSON) (AI-003).
- [x] If a call fails (network, 4xx, 5xx, schema-invalid output), the API still stores a usage row with status and error, and returns a typed error the caller can act on (AI-003).
- [x] If Gemini answers 429, the error is typed as rate-limited with the retry delay the provider gave, so callers leave the work pending instead of failing it. A 503/504 (overloaded) is typed `unavailable`; both are `retryable`.
- [x] If `tools` is passed without `limits`, the client refuses the call before sending it (AI-002); covered by a unit test.
- [x] Cost is computed from a price constant per model (input, output, cached input per million tokens). A model missing from the constant records tokens with a null cost.
- [x] `AI_GEMINI_BILLING=free|paid` env: on `free`, the row stores the list-price cost as an estimate and marks it not billed, so budgets still work as a token cap.
- [x] The key is read only from `GEMINI_API_KEY`; no response, log or row ever contains it (AI-004).
- [x] `GET /api/ai/status` (JWT, admin) returns configured yes/no, a masked key suffix, billing mode and default models; `POST /api/ai/test` (optional `{ model }`) makes one minimal call and returns success + latency or the provider error.
- [x] Migration adds `ai_usage_records` (indexes on createdAt, feature, and ref).

## Technical Notes
- Structured output: Gemini `responseMimeType: 'application/json'` + `responseJsonSchema` from the Zod schema (`z.toJSONSchema`, Zod v4). Validate the answer with the same Zod schema; invalid output is a failed call.
- Trace JSON holds what the response metadata gives: grounding queries, grounding source URLs, URL context retrieval statuses. Store as-is, typed loosely; 417 and 418 read it.
- Free tier: Google may use free-tier prompts to improve its products. Radar sends public posts plus the workflow profile; say this in the AI integration screen copy (417), no code change.
- Pricing: check current Gemini prices when writing the constant; keep it in one file (`ai-model-prices.ts`) with the date it was checked.
- Do not add a provider abstraction beyond the port; one implementation is enough.
- Follow `.context/patterns-architecture.md` (Controllers → Services → Repositories).

**Specialized Skill:** prisma-migrate — the `ai_usage_records` table
**Key sections to read:** §Step 2, §Step 6

**Specialized Skill:** be-test — cost math, the free/paid estimate, the tools-without-limits refusal, 429 typing
**Key sections to read:** §Core Workflow

## Files to Touch
- apps/api/src/modules/ai/** (new: module, port, gemini client, prices, usage repository, admin controller)
- apps/api/prisma/schema.prisma + new migration
- apps/api/src/app.module.ts (register module)
- package.json (`@google/genai`)
- libs/shared/utils/types/src/lib/ (AI status / usage DTO types)

## Dependencies
- None

## Complexity: M

## Progress Log
- 2026-10-06 Started. Using prisma-migrate for ai_usage_records, be-test for the client/cost specs
- 2026-10-06 Code written (hexagonal: domain types + AiCostPolicy; application ports IAiClient / IAiProvider / IAiUsageRepository + AiClientService use case; infrastructure GeminiProvider + AiUsageRepository; presentation AiAdminController). `tsc` clean. Routes are `/api/ai/status` and `/api/ai/test` (same prefix style as `/api/radar`, not `/api/admin/ai`). No shared FE types yet: 417 defines them in its lib, like feature-radar does. Default model `gemini-3.8-flash`, override with `AI_GEMINI_MODEL`. Waiting on: Owner runs the create-only migration; be-test plan approval.
- 2026-10-06 Migration 20261006102543_20261006_ai_usage_records applied locally (safe: new enum + table + 3 indexes)
- 2026-10-06 Specs: ai-client.service (7), ai-cost.policy (2), gemini.provider (6) = 15 pass; tsc app + spec clean. Local `/api/ai/status` answers 200 but `configured: false`: the running API process does not see GEMINI_API_KEY. Status/test AC waits on a live call that succeeds.
- 2026-10-06 Live check on local API: first test hit MAX_TOKENS (cap 64 eaten by thinking) → cap raised to 1024 and the finish reason now goes into the error. `gemini-3.8-flash` answered 503/504 (overloaded) → new retryable kind `unavailable`. `gemini-3.5-flash-lite` succeeded: 17 in / 5 out tokens, cost 18 micro-USD, billed false, row recorded. `gemini-2.5-flash` is closed to new users (404). 16 specs pass, tsc clean.
- 2026-10-06 Done — all ACs satisfied
