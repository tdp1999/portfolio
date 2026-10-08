# Epic: Radar Phase C (fully automatic with Gemini, YouTube and RSS, AI integration)

## Summary

Phase C makes Radar fully automatic. Everything the `/radar work` skill does inside a Claude Code session today moves into the API and runs on Gemini: reading each post with its images and video, reading its links, researching the tools and claims it names, digesting its comments, writing the enrichment, and writing the catch-up brief. A run started from the console goes from capture to `done` with nobody at a terminal. Radar also learns two new source kinds, YouTube channels first and then RSS feeds (Substack first), and videos get a transcript before analysis. Every Gemini call is recorded with its tokens and cost, a run stops at its cost budget, and a new console screen, **AI integration**, shows configuration status, usage and spend in one place. Before the switch, a quality check compares Gemini's enrichments with the current Claude Code ones on the same posts.

## Why

- Phase A and B need a Claude Code session for every analysis and every brief. The Owner has to sit at a terminal, and the work stops when the session or the laptop does. The Owner wants Radar to run on its own.
- Much of the best AI content is long YouTube videos and Substack newsletters, not Facebook posts.
- In the last worker run, 3 of 23 posts were reels whose content the analysis could not see. Transcripts close that gap.
- Once the server calls a paid API, spend must be visible and capped. Today nothing in the app says whether an AI key is configured, how many tokens were used, or what it cost.

## Target Users

- The Owner (single user, console admin).

## Scope

### In Scope

**AI integration foundation (cross-module, Radar is the first consumer)**
- A small `ai` module in the API with one Gemini client: one request in, one structured answer out, plus token usage.
- Model prices (input, output, cached input per million tokens) kept as a code constant and used to turn tokens into cost.
- A usage ledger: one row per AI call (model, feature, input/output/cached tokens, cost, status, latency, error, the run or item it served).
- The Gemini API key stays in an environment variable (Railway). The app never stores or shows the key, only whether it is configured and a masked suffix.
- The module is shaped so another provider can be added later, but Phase C ships Gemini only.

**Console: AI integration screen (simple first)**
- Gemini status: configured or not, "Test connection", default model per feature, last call, last error.
- Usage and spend: totals for today, the last 7 days and the last 30 days, broken down by model and feature (analysis, transcript, brief, test).
- Remaining quota or credit is not readable with an ordinary Gemini key, so the screen links to the AI Studio usage and billing pages instead.

**Gemini replaces the Claude Code worker end to end**

The app stays a pipeline: Radar's state machine decides the steps, and a model call (with or without tools) only fills in one step's output.

- **Analysis**: a `gemini` adapter behind `ILlmProvider` writes the enrichment schema v3 for each item: text, own and shared images, transcript, comments, links, workflow profile. One structured-output request per item, validated with the same Zod schema the worker submit uses.
- **Links**: Gemini's URL context tool reads the post's links inside the analysis request. The app passes only allowed URLs (Facebook links are dropped before the call, RAD-003) and records each URL's retrieval status.
- **Research and fact check**: Google Search grounding inside the same request, so `context`, `scoreReason` and `factCheck` rest on current facts. The search queries and source URLs the provider returns are stored with the enrichment and shown in the Detail page.
- **Tool guardrails** (tools are allowed; side effects are not): every tool-using call is **bounded** (caps on tool rounds, tokens per item and spend per run), **traceable** (each call, tool use, query, URL and failure reason is recorded and visible per item), and **sourced** (a claim from search or a link carries its source; a fact check without a source is not marked `major`).
- **Comments**: the comments the run already fetched go into the request; the digest rules stay the same.
- **Brief**: when the Owner requests a brief in the console, the API writes it with Gemini from the analyzed items in the window, in one request, with the same rules `/radar work brief` follows (grouped by provider and topic, new terms, a link to each post).
- **Instructions**: the analysis and brief rules move from `.claude/skills/radar/references/` into the API as the prompt's single source.
- **New run flow `AUTO`**: capture → normalize and images → comments (when asked) → transcript → analysis → `done`, advanced by the existing cron tick. `MANUAL` upload also lands in the automatic analysis.
- **Budget**: each run has a cost budget; once its recorded spend reaches it, the run stops starting AI calls and the remaining items stay pending for the next run.
- **Retry**: a response that fails validation gets one retry with the validation error attached, then the item is marked failed. App code decides the retry, never the model.

**Video transcripts**
- A transcript step for video items: YouTube videos (Gemini reads public YouTube URLs directly) and Facebook reels (video file uploaded to Gemini).
- The transcript is stored on the item, shown in the Detail page, and fed to the analysis.
- A maximum video length per source, and a cost estimate from the duration checked against the budget before the call.

**New sources (YouTube first, then RSS)**
- **YouTube**: a source is a channel. Capture lists the channel's uploads for a window through the YouTube Data API v3 (uploads playlist, API key, no OAuth, no Owner account). Each video becomes an item: title, description, duration, thumbnail, link.
- ~~**RSS**~~ (dropped 2026-10-07, see Changelog): a source is a feed URL, Substack first. Capture reads the feed and creates one item per entry, with best-effort backfill from the site's archive listing.
- Adding a source row of either kind from the console.

**Quality check before the switch**
- Run the `gemini` adapter on about 10 items that already have a Claude Code enrichment, store Gemini's results as trials (without replacing the current enrichment), and show both side by side with tokens and cost. The same page can compare two Gemini models (a Flash and a Pro model) to choose the default per feature.

### Out of Scope
- **Turning the app into an agent harness.** No general-purpose agent, no chat surface, no model-driven planning of the pipeline's steps, no sub-agents, no memory system, no MCP server inside the app. Tools are allowed inside a step under the guardrails above; they never add steps, start runs, or write anything outside the step's own output.
- Anthropic and any other provider. The module leaves room for one, but none ships in this epic.
- Scheduled or recurring runs (RAD-006 stays). Runs still start only when the Owner triggers them.
- Tuning for many sources (per-source schedules, cross-source deduplication, ranking across sources).
- Other platforms (X, LinkedIn, Facebook groups and pages beyond what works today).
- Bright Data and ScrapeCreators capture adapters.
- Translation, multi-user access, sharing.
- Storing API keys in the database or editing them from the console.

## High-Level Requirements

1. When an `AUTO` run is triggered, the API shall carry it from capture to `done` without any external worker.
2. When the `gemini` adapter analyzes an item, the API shall send exactly one structured-output request that includes the item's text, images, transcript, fetched link text, fetched comments and the workflow profile, and shall store the validated result as the item's enrichment.
3. If an analysis response fails enrichment schema validation, then the API shall retry once with the validation error and, if it fails again, shall mark the item failed with the reason and continue with the next item.
4. When an AI call uses tools, the API shall enforce its caps (tool rounds, tokens per item, run budget) and shall record every tool use (query or URL, status, failure reason) against the item it served.
5. When the API makes an AI call, it shall record one usage row with model, feature, input, output and cached tokens, cost, status and latency, whether the call succeeded or failed.
6. When a run's recorded spend reaches its budget, the API shall stop starting AI calls for that run and shall leave the remaining items pending.
7. Where a model has no price in the price constant, the API shall record its tokens with an unknown cost and the console shall flag that model.
8. While the Gemini API key is not configured, the API shall refuse to start an `AUTO` run and shall name the missing configuration.
9. The API shall never return an API key in any response; the AI integration screen shall show only configured status and a masked suffix.
10. When the Owner triggers "Test connection", the API shall make one minimal request and report success and latency, or the provider's error.
11. When a video item reaches analysis without a transcript, the API shall create its transcript first.
12. If a transcript cannot be produced (private video, too long, provider limit, expired URL), then the API shall mark it failed with a reason and shall still analyze the item from its text and images.
13. If a link cannot be fetched, then the API shall analyze the item without that link and shall leave it out of `linkSummaries`.
14. When the Owner requests a brief, the API shall write it with Gemini from the analyzed items in the window and shall link every claim to an item in that window.
15. When a YouTube source is captured for a window, the API shall create one item per public video published in that window (RAD-001 applies).
16. (Dropped 2026-10-07, see Changelog.) ~~When an RSS source is captured, the API shall create one item per feed entry not seen before for that source and refresh the ones it has seen.~~
17. When the Owner runs the quality check on a set of items, the API shall store each result as a trial and shall not change the items' current enrichment.
18. The AI integration screen shall show usage and cost totals per model and feature for today, the last 7 days and the last 30 days.

## Technical Considerations

### Architecture
- **New `ai` module** in `apps/api/src/modules/ai/` (Controllers → Services → Repositories). It owns the Gemini client, the price constant, the usage ledger, the call trace (tool uses, queries, URLs, sources), the status and test endpoints, and the AI integration admin endpoints. Radar depends on it through a port, `IAiClient.generateStructured({ model, system, parts, schema, feature, refs, tools?, limits })` returning `{ data, usage, trace }`. `limits` is required whenever `tools` is set.
- **Radar `gemini` adapter** implements `ILlmProvider.process`: per tick it takes a small batch of pending items, builds each request (text, images from Cloudinary, transcript, link text, comments, workflow profile as a cached prefix), calls `IAiClient` once per item, validates with `radar-enrichment.schema.ts`, and stores through the same path as the worker submit. Batches stay small for Railway memory (task 387).
- **Brief**: the synthesize step calls `IAiClient` once with the window's enrichments (not the raw posts) and validates the brief shape task 412 already defines.
- **Instructions**: the canonical analysis and brief prompts live in the radar module (for example `radar/application/prompts/`), versioned with the schema. The enrichment guide in the skill is retired or reduced to a pointer.
- **Link reading**: the URL context tool inside the request; the app filters the URL list first (Facebook domains refused, RAD-003) and stores the provider's retrieval status per URL. If the tool proves unreliable for some sites, an app-side fetcher is the fallback, decided in the adapter task.
- **Transcript step**: YouTube passes the public URL as a file part; reels use the video URL from the capture payload, downloaded and uploaded to Gemini's file API right after capture, before the signed URL expires.
- **YouTube capture**: YouTube Data API v3 `playlistItems` on the channel's uploads playlist plus `videos` for duration, paged so memory stays flat. The channel RSS feed holds only the latest 15 videos, so it is not enough for a window.
- **RSS capture**: feed parsing plus a normalizer to `RadarItem`; Substack's archive listing for backfill, best effort.
- **Platform enum**: `RadarPlatform` gains `YOUTUBE` and `RSS`; the capture adapter and normalizer are picked by platform.
- **Run flow**: `RadarRunFlow` gains `AUTO`; the state machine adds the transcript step and runs analysis in-process instead of parking at `awaiting-external`.
- **The external worker path** (`external-worker` adapter, worker endpoints, machine token, `/radar work` skill) stays as a fallback, no longer the default, until the production acceptance run passes; the last task decides whether to remove it.
- **Console**: the AI integration screen lives outside `feature-radar` (for example `libs/console/feature-ai`) and is reached from the sidebar. The Runs dialog gains the `AUTO` flow and a budget field; the Detail page shows the transcript.

### Dependencies
- Gemini API key (Google AI Studio; the Owner starts on the free tier, switches to paid when its limits get in the way) and a YouTube Data API v3 key, both created by the Owner and set as Railway variables, never pasted into chat or the repo.
- SDK: `@google/genai` (new dependency, kept inside the `ai` module).
- Existing: `ILlmProvider` port and run state machine (task 409), comments capture (411), brief model (412), enrichment schema v3, Cloudinary image persistence.

### Data Model
- `AiUsageRecord` (new): provider, model, feature (`radar.analyze`, `radar.transcript`, `radar.brief`, `ai.test`), status, input / output / cached / tool tokens, cost in micro-USD (nullable when the price is unknown), latency, error, ref type + ref id, trace (JSON: tool uses, search queries, URLs with retrieval status, source URLs), created at.
- `RadarEnrichment`: add `sources` (the URLs the analysis relied on, from grounding and URL context).
- Model prices: a code constant in the `ai` module (input, output, cached input per million tokens, with the date checked), not a table. On the free tier the ledger stores the list-price cost as an estimate marked not billed, so the run budget still works as a token cap.
- `RadarRun`: add `budgetMicroUsd`; spend is summed from the ledger. `RadarRunFlow` gains `AUTO`.
- `RadarItem`: transcript text, transcript status (`NONE | PENDING | DONE | FAILED`), reason, video duration.
- `RadarEnrichmentTrial` (new): item, adapter, model, payload, tokens, cost, created at. Used only by the quality check.
- `RadarPlatform`: add `YOUTUBE`, `RSS`.
- No rich-text editor fields, so the ADR-023 four-column contract does not apply.

## Risks & Warnings

⚠️ **Harness creep**
- Moving the skill into the API is where a harness grows: a chat box, a model that plans the pipeline, a generic agent endpoint.
- Mitigation: the state machine owns the steps; tools live inside one step and only fill that step's output; no chat or agent surface; the review checklist rejects any change that lets a model add steps or act outside its step.

⚠️ **Tool side effects**
- Search and URL reading can burn tokens, fail silently, or bring in wrong information.
- Mitigation: hard caps per call and per run; every tool use and failure recorded per item and visible in the console; sources stored and shown next to the analysis; a fact check needs a source to be `major`.

⚠️ **Quality drop against Claude Code**
- Claude Code researches across several searches and pages, reads the Owner's setup, and self-corrects. One Gemini request does less.
- Mitigation: the quality check on real items before switching; the workflow profile in every request; Google Search grounding for research; a stronger model for analysis if Flash falls short.

⚠️ **Cost runaway**
- Video tokens are large: about 258 tokens per frame at one frame per second plus audio, so a one-hour video is close to a million input tokens.
- Mitigation: budget per run checked before each call, a cost estimate from the video duration, a maximum video length per source, spend per feature on the AI integration screen.

⚠️ **Remaining credit is not available**
- Gemini returns tokens per response but has no balance endpoint for an ordinary key.
- Mitigation: the app's own ledger is the source of truth for usage and cost; the screen links to AI Studio for quota and billing.

⚠️ **Transcript limits**
- Gemini reads only public YouTube videos and limits video length per day; reel URLs are signed and expire like images.
- Mitigation: transcript right after capture, failure recorded with a reason, analysis falls back to text and images.

⚠️ **Feed and API quirks**
- The YouTube Data API has a daily quota; Substack's archive listing is not an official API.
- Mitigation: page through the documented YouTube API; Substack backfill is best effort with the feed as fallback; per-run counts make drops visible.

⚠️ **Key exposure**
- A screen about keys is a tempting place to paste or show them.
- Mitigation: keys only in environment variables, never in the database, never in a response.

## Alternatives Considered

### Keep Claude Code as the analysis worker, add Gemini only for transcripts
- **Pros:** best analysis quality, no API cost for analysis.
- **Cons:** still needs a terminal session for every run.
- **Why not chosen:** the Owner wants Radar fully automatic.

### Gemini plus Anthropic adapters
- **Pros:** a second provider to compare and fall back to.
- **Cons:** a second SDK, key, price table and quality check, for a single-user tool.
- **Why not chosen:** Gemini covers text, images, video and search grounding in one provider; the module leaves room to add another later.

### Use an AI gateway (OpenRouter, LiteLLM, Helicone) for usage and cost
- **Pros:** usage and cost out of the box.
- **Cons:** another external service or always-on process, and a second place to read spend.
- **Why not chosen:** one provider and one consumer fit in a small module with a ledger.

### Fetch every link in the app before the call, no tools at all
- **Pros:** fully deterministic input.
- **Cons:** no research or fact check against current facts; the app has to extract readable text from every site.
- **Why not chosen:** provider tools (Google Search, URL context) do this better inside the request, and the guardrails keep them bounded and traceable. The app-side fetcher stays as a fallback.

### YouTube captions through the YouTube Data API
- **Pros:** official text, no model cost.
- **Cons:** downloading captions requires OAuth as the video owner.
- **Why not chosen:** Gemini reads public videos directly, and the same path covers reels.

## Success Criteria

- [x] An `AUTO` run triggered from the Runs page reaches `done` with no Claude Code session, and every item in it has a valid v3 enrichment.
- [ ] A brief requested in the console is written by Gemini without a Claude Code session, and every claim links to a post in its window.
- [x] A run with a budget of $0.50 stops before its recorded spend exceeds the budget plus one call, and its remaining items stay pending.
- [x] A YouTube video of 20 minutes or more shows a transcript and an enrichment that refers to what was said in it.
- [ ] One YouTube channel captures a 3-month window into the Feed with no duplicates.
- [ ] The quality check page shows Gemini next to Claude Code for at least 10 items, and the Owner has recorded the chosen default model per feature.
- [x] The AI integration screen shows Gemini's status, and its 30-day cost matches the sum of the usage rows.
- [ ] For any analyzed item, the Detail page shows the sources the analysis used and the AI calls behind it (tokens, cost, tool uses, failures).
- [x] No AI request is sent with tools and without limits (enforced by a test on the `ai` client).

### Acceptance gaps (accepted by the Owner, no fix task)

Production acceptance (task 424, 2026-10-08) left four criteria unticked. The Owner accepted them as they are:

- **Brief links:** the brief was written by Gemini and all 33 cited posts fall inside its window; that every claim carries a link was not checked by eye.
- **3-month YouTube window:** the YouTube run captured one day (one video). A 3-month window was not run, mainly for cost: a 20-minute transcript alone costs about $0.10.
- **Quality check:** no Gemini trials were run next to Claude Code enrichments, and no default model per feature was recorded. ADR-036 makes the quick pass the default, which settles the question in practice.
- **Detail page:** sources show on a deep post; the AI-calls panel was not checked by eye.

## Estimated Complexity

L

**Reasoning:** a new cross-module `ai` module with a ledger and a console screen; the Gemini analysis adapter that absorbs the whole skill (images, links, grounding, comments, retry, budget); the brief on Gemini; a transcript step; two capture adapters and normalizers; a quality check. About 9 tasks:
1. `ai` module: Gemini client, price constant, usage ledger, status and test endpoints.
2. AI integration console screen.
3. Gemini analysis adapter: prompt moved from the skill, link fetcher, grounding, retry, budget, `AUTO` flow.
4. Quality check: trials and the side-by-side page (decides the default model before the switch).
5. Brief on Gemini.
6. Transcript step (YouTube URL and reels).
7. YouTube source.
8. RSS / Substack source.
9. Production acceptance run, then retire or keep the worker path.

## Open Decisions (settle before or during breakdown)

- The exact caps (tool rounds, tokens per item) and the default run budget, set from the quality check's real numbers.
- Which YouTube channels and Substack feeds come first, and the backfill window for each.
- Default model per feature: **settled 2026-10-07 by the quality check (task 419)**. Gemini replaces Claude Code as the default writer. Analysis deep pass `gemini-3.8-flash` then `gemini-3.5-flash`, light pass `gemini-3.1-flash-lite` then `gemini-3.5-flash-lite`, brief on the deep chain; no Pro model needed. Content matched Claude Code; the only gap was markdown formatting, fixed in the analysis rules.

## Specialized Skills

- **prisma-migrate**: ledger, trial table, transcript columns, `AUTO` flow and platform enum values. → tasks 416, 418, 419, 421, 422
- **be-test**: cost math, budget stop, retry rule, validation, YouTube normalizer, link fetcher refusal of Facebook. → tasks 416, 418, 421, 422, 423
- **ng-lib**: the console AI integration library. → task 417

## Status

completed

Broken down into tasks 416-424 on 2026-10-06. Simplified at breakdown: prices as a code constant (no price table), call trace as JSON on the usage row, quality check as a trial table plus a plain compare view, Gemini free tier first (429 leaves work pending, cost recorded as an estimate).

## Created

2026-10-06

## Changelog

### 2026-10-08 Production acceptance and quick-only analysis
- Updated: acceptance results and gaps recorded under Success Criteria; ADR-036 makes the quick analysis the default and deep a per-run opt-in (task 427).
- Reason: deep was 85% of an Auto run's spend and most deep calls lowered the quick score.

### 2026-10-07 RSS / Substack dropped
- Updated: task 423 (RSS / Substack source) aborted; Phase C new sources are YouTube only. The RSS requirement (16), scope bullet and success criterion no longer apply.
- Reason: the Owner's decision.
