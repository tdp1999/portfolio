# Task: AI page shows provider limits, provider-independent

## Status: done

## Goal
The AI page shows every limit the app can learn about the provider and its models, next to how much of each the app has used, without code that only fits Gemini.

## Context
From `epic-radar-phase-c`, asked by the Owner on 2026-10-07 while 418 was in progress. AUTO runs make limits matter (search queries are billed per query, rate limits stop a run). The Owner may later add OpenAI or Claude, so the page reads a neutral shape that each provider adapter fills with what it can.

What each provider exposes (checked 2026-10-07):
- Gemini: no rate-limit headers on responses (only `x-gemini-service-tier`). `models.get` returns `inputTokenLimit`, `outputTokenLimit`, `thinking`. A 429 body names the quota metric, its limit and the model. RPM / TPM / RPD per tier and remaining credit are only on AI Studio. Search: 5,000 free queries per month shared by Gemini 3.x, then $14 per 1,000.
- OpenAI and Anthropic (for later adapters): every response carries rate-limit headers (limit, remaining, reset for requests and tokens).

## Acceptance Criteria
- [x] The Limits section shows the daily spend cap (`AI_DAILY_CAP_USD`) against today's recorded spend.
- [x] `IAiProvider` gains a neutral way to report limits: per model (input / output token limit, thinking), and observed limits (metric, window, limit, remaining when known, reset when known, source `header` | `error` | `model-info` | `documented`). Gemini fills it from `models.get`, parsed 429 bodies and a documented-allowance table (search 5,000 per month); nothing outside the Gemini adapter knows Gemini field names.
- [x] The last observed limit per metric is kept (from response headers or a rate-limit error), so a 429 seen during a run shows on the page afterwards.
- [x] Usage against each limit is computed from the ledger, provider-agnostic: calls in the last minute and today, tokens today, billed tool calls (search queries) this month against the free allowance.
- [x] The AI page has a Limits section: per model token limits, each known limit with used / remaining / reset and where the number came from; a limit the provider does not expose says so and links to the provider's page.
- [x] When the provider is not configured or the metadata call fails, the section says why and the rest of the page still works.

## Technical Notes
- Keep the documented allowances in a code constant per provider, like `AiCostPolicy.PRICES`, with the date they were checked.
- Model metadata changes rarely: cache it in memory for a few hours; never call `models.get` per page view.
- Console page: read `.context/design/cookbook/console.md` and `.context/angular-style-guide.md` first.

## Files to Touch
- apps/api/src/modules/ai/** (port, Gemini adapter, query, endpoint)
- libs/console/feature-ai/src/lib/ai-usage.list/**, ai.data.ts

## Dependencies
- 418 - search query counts on usage rows

## Complexity: M

## Progress Log
- 2026-10-07 Started. Owner (mid-task): they are looking at OpenAI-compatible providers such as DeepSeek to replace Gemini later, so every AI interface and the AI page must stay provider-neutral and plug-and-play.
- 2026-10-07 Design. `IAiProvider` = `profile` + `generate` + `getModelInfo` + `getBalance`. `AiProviderProfile` (domain/ai-limit.types.ts) declares name, display name, key env, links (pricing, usage, limits), `reportsRateLimits`, documented allowances with `checkedOn`. Responses carry `limits` (header-reported, empty for Gemini); `AiCallError` carries the limits a 429 named. `AiLimitStore` keeps the last observed limit per metric and model in memory (one API instance; a restart empties it until the next 429 or header) and caches model metadata 6 h (failures 10 min). Ledger counts in one SQL query (`countLedger`); `AiLimitPolicy` maps kind + window to the ledger figure and computes remaining. Balance added beyond the ACs because DeepSeek exposes `/user/balance`; Gemini returns null.
- 2026-10-07 Provider-neutral cleanup: config `geminiApiKey` -> `apiKey` (env names read only in `ai.config.ts`), `DEFAULT_AI_MODEL`, client messages use `profile.keyEnv`, `/ai/status` returns the provider profile instead of `'gemini'`, the console page and notes read display name, key env and links from it (AI Studio and Gemini pricing constants removed from `ai.data.ts`), Radar's AUTO-off message and caption no longer name Gemini. Remaining Gemini-specific data by design: model prices in `AiCostPolicy.PRICES`, Radar's default model chains (env-overridable), env names `GEMINI_API_KEY` / `AI_GEMINI_*`.
- 2026-10-07 Gemini fills it: `models.get` for token limits and thinking, 429 `QuotaFailure` violations (JSON, with a plain-text fallback) parsed to neutral limits with remaining 0 and reset = retry delay, documented search allowance 5,000 per month.
- 2026-10-07 Console: Limits section (spend today vs daily cap with bar, calls, tokens, search queries, credit when known; notice when the provider does not report rate limits with its rate limit page; limits table with used / limit / remaining / resets / source; model limits table with per-model errors; not-configured and failure states), loaded on its own request so a failure leaves the page working. View model in `toLimitsView` (no template calls).
- 2026-10-07 Tests: gemini quotaLimits (JSON body, text fallback), AiLimitPolicy, GetAiLimitsHandler (cap + documented, model order / per-model failure / cache, not configured, observed limit), client keeps a 429's limits. AI + Radar 47 suites / 274 tests pass, feature-ai 3 pass, api tsc clean, `nx build console` OK. Live: `/ai/limits` returns cap, 4 of 5,000 searches, token limits for 3 of 4 models (one transient "fetch failed", shown per model). Feature guide updated (endpoints, provider swap callout, roadmap).
- 2026-10-07 Done: all ACs satisfied.
- 2026-10-07 Pre-commit review fixes: a limit a 429 reported falls back to the ledger figure once its reset time has passed; the recent-calls search count reads the trace for rows written before the `searchQueries` column.
