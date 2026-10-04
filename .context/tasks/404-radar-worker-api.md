# Task: Radar — machine token, LLM port and external worker API

## Status: pending

## Goal
Let Claude Code (machine client) claim pending items, read the workflow profile, and submit validated enrichments through token-protected endpoints.

## Context
Epic `epic-radar-ai-news` (Phase A). `ExternalWorker` is the first `LLM_PROVIDER` adapter: instead of calling a model, it parks the step in `AWAITING_EXTERNAL` and exposes the work over HTTP. Server-side LLM adapters come in Phase C.

## Acceptance Criteria
- [ ] A `MachineTokenGuard` accepts a bearer token whose hash matches the env value, using a constant-time comparison.
- [ ] If a worker endpoint receives a missing or invalid token, then it responds 401 and changes no data.
- [ ] The machine token is rejected by every non-worker endpoint (RAD-004).
- [ ] `POST /radar/work/claim` with a step and a limit returns at most that many pending items with their text, persisted image URLs, links and permalink, and marks them claimed with a lease of 30 minutes.
- [ ] If a claimed item's lease expires without a result, then the next claim returns it again (RAD-005).
- [ ] `POST /radar/work/results` stores one `RadarEnrichment` per item and marks the item done for that step.
- [ ] If a submitted result fails the Zod enrichment schema, then that item's result is rejected with an error and the item stays pending; valid results in the same batch are still stored.
- [ ] Submitting the same item's result twice leaves exactly one enrichment (the later one).
- [ ] `GET /radar/work/profile` returns the current `RadarWorkflowProfile` markdown; admin endpoints read and upsert it.
- [ ] Unit tests cover the guard, lease expiry, and schema rejection.

## Technical Notes
- Enrichment schema (Zod v4): `tldr` (string, max 280), `providerTags` (enum array: anthropic, openai, google, meta, xai, deepseek, opensource, other), `contentType` (news, tool, workflow, opinion, tutorial, promo), `signalScore` (int 0-10), `isPromo`, `isRelevant`, `imageNotes`, `linkSummaries` (array of {url, summary}), `commentDigest`, `factCheck`, `applyNote` (markdown), `producer` {adapter, model}, `schemaVersion`. Keep the enum list in one shared constant used by the console filters too.
- Env: `RADAR_WORKER_TOKEN_HASH` (sha-256 of the token). Read with the required-var helper pattern from `auth/application/auth.config.ts`. The Owner generates the token; Claude never sees the plaintext in chat.
- Claim must be atomic (single `UPDATE ... WHERE status = pending OR lease expired ... RETURNING`) so two workers never get the same item.
- Throttle worker routes like `contact-message.controller.ts:43-44`.

**Specialized Skill:** be-test — tests only the guard, lease and schema logic
**Key sections to read:** logic vs non-logic triage

## Files to Touch
- apps/api/src/modules/radar/application/guards/machine-token.guard.ts (+ .spec.ts)
- apps/api/src/modules/radar/application/ports/llm-provider.port.ts
- apps/api/src/modules/radar/infrastructure/llm/external-worker.adapter.ts
- apps/api/src/modules/radar/application/commands/claim-work.command.ts (+ .spec.ts)
- apps/api/src/modules/radar/application/commands/submit-results.command.ts
- apps/api/src/modules/radar/application/radar-enrichment.schema.ts
- apps/api/src/modules/radar/application/commands/workflow-profile.upsert.command.ts
- apps/api/src/modules/radar/presentation/radar-worker.controller.ts

## Dependencies
- 401 - tables
- 402 - module exists

## Complexity: L

## Progress Log
