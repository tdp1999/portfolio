# Task: Radar — machine token, LLM port and external worker API

## Status: done

## Goal
Let Claude Code (machine client) claim pending items, read the workflow profile, and submit validated enrichments through token-protected endpoints.

## Context
Epic `epic-radar-ai-news` (Phase A). `ExternalWorker` is the first `LLM_PROVIDER` adapter: instead of calling a model, it parks the step in `AWAITING_EXTERNAL` and exposes the work over HTTP. Server-side LLM adapters come in Phase C.

## Acceptance Criteria
- [x] A `MachineTokenGuard` accepts a bearer token whose hash matches the env value, using a constant-time comparison.
- [x] If a worker endpoint receives a missing or invalid token, then it responds 401 and changes no data.
- [x] The machine token is rejected by every non-worker endpoint (RAD-004).
- [x] `POST /radar/work/claim` with a step and a limit returns at most that many pending items with their text, persisted image URLs, links and permalink, and marks them claimed with a lease of 30 minutes.
- [x] If a claimed item's lease expires without a result, then the next claim returns it again (RAD-005).
- [x] `POST /radar/work/results` stores one `RadarEnrichment` per item and marks the item done for that step.
- [x] If a submitted result fails the Zod enrichment schema, then that item's result is rejected with an error and the item stays pending; valid results in the same batch are still stored.
- [x] Submitting the same item's result twice leaves exactly one enrichment (the later one).
- [x] `GET /radar/work/profile` returns the current `RadarWorkflowProfile` markdown; admin endpoints read and upsert it.
- [x] Unit tests cover the guard, lease expiry, and schema rejection.

## Technical Notes
- Enrichment schema (Zod v4): `tldr` (string, max 280), `providerTags` (enum array: anthropic, openai, google, meta, xai, deepseek, opensource, other), `contentType` (news, tool, workflow, opinion, tutorial, promo), `signalScore` (int 0-10), `isPromo`, `isRelevant`, `imageNotes`, `linkSummaries` (array of {url, summary}), `commentDigest`, `factCheck`, `applyNote` (markdown), `producer` {adapter, model}, `schemaVersion`. Keep the enum list in one shared constant used by the console filters too.
- Env: `RADAR_WORKER_TOKEN_HASH` (sha-256 of the token). Read with the required-var helper pattern from `auth/application/auth.config.ts`. The Owner generates the token; Claude never sees the plaintext in chat.
- Claim must be atomic (single `UPDATE ... WHERE status = pending OR lease expired ... RETURNING`) so two workers never get the same item.
- Throttle worker routes like `contact-message.controller.ts:43-44`.

**Specialized Skill:** be-test — tests only the guard, lease and schema logic
**Key sections to read:** logic vs non-logic triage

## Files to Touch
- apps/api/src/modules/radar/application/guards/machine-token.guard.ts (+ .spec.ts)
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
- 2026-10-05 Started. Using be-test for guard, lease and schema tests
- 2026-10-05 Decisions (Owner): `LLM_PROVIDER` port + `ExternalWorker` adapter moved to task 409, where the state machine first calls them (nothing would call them in Phase A). Unset `RADAR_WORKER_TOKEN_HASH` disables the worker routes (401 + boot warning) instead of crashing the deploy. `claim` accepts step `ANALYZE` only: items carry one `workStatus`, image enrichment already runs server-side (403), and synthesize works on `radar_briefs`. Claimed images use `storedUrl` when stored, else the original URL.
- 2026-10-05 Implemented: `MachineTokenGuard` (sha-256 + `timingSafeEqual`, 401 when the hash env is unset), enrichment Zod schema with provider/content enums shared via `@portfolio/shared/types`, claim (`SELECT ... FOR UPDATE SKIP LOCKED` + update in one transaction, newest first, 30 min lease), results (per-item validation, upsert by itemId, rejected items released to pending), workflow profile (worker GET, admin GET/PUT). Worker routes throttled 120/min.
- 2026-10-05 Real-DB run (AppModule + supertest, spec deleted): no/bad token 401 with no state change; machine token on `GET /radar/sources` 401; claim 2 then claim returns the third only; expired lease reclaimed (claimCount 2); batch with one valid + one invalid result stored 1, rejected 1 with Zod reasons, invalid item back to PENDING; resubmit left 1 enrichment with the later tldr and deduped tags; step SYNTHESIZE 400; empty profile `{body:"", updatedAt:null}`.
- 2026-10-05 Tests (be-test, plan approved): guard x4, submit-results x3 (mixed batch, transforms, missing item), lease expiry as a Postgres integration spec x1 (logic lives in SQL; CI has a Postgres service). Radar suite 25/25, api spec + shared types tsc clean, lint clean.
- 2026-10-05 Done — all ACs satisfied
- 2026-10-05 Pre-commit review fixes: CI `ci` job gains a Postgres service + `prisma migrate deploy` so the lease integration spec runs (only the e2e job had a DB). Rejected results no longer release the item: it keeps its lease (worker can resubmit at once, else it returns on expiry), so a late submit never steals a reclaimed item (Owner choice). Claim skips items with `claimCount >= 3` so a post the worker keeps failing cannot loop forever (re-queue from the console later). Lease cutoff compared as `ISO::timestamp(3)`, independent of session time zone. Submit batch capped at 10 (worst case still fits one by one under the 100 KB JSON limit). Profile uses a fixed singleton id + `upsert`, race-free. Added config loader spec x3 and cap integration test. Radar suite 29/29, tsc + lint clean.
