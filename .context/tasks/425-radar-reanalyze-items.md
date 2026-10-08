# Task: Re-analyze Radar items, one or many

## Status: done

## Goal
The Owner can have items that were already analyzed analyzed again, one at a time from the Detail page or many at once from the Feed table (selected across pages). By default the server analyzes them right away with the AUTO analysis (Gemini); sending them to `/radar work` (Claude Code) is the other choice.

## Context
Asked by the Owner on 2026-10-07, after task 418c. Today an item that reached `workStatus = DONE` is never claimed again: neither `/radar work` nor the AUTO analysis takes it, and a re-capture keeps its `workStatus`. The only requeue path is "Requeue stuck", which only covers items that failed 3 claims.

Owner decisions (2026-10-07):
- Default is AUTO, not the Claude Code skill.
- Bulk selection only in the Feed's Table view, not in Split view.
- The checkbox column shows only while bulk mode is toggled on, never permanently.

Facts that shape the design:
- ENRICH is not needed. It stores images on Cloudinary and, when the run asked for it, fetches comments through Apify. It uses no AI, and an analyzed item already went through it. The comment count comes from the capture itself (NORMALIZE).
- Claude Code path: `POST /radar/worker/claim` already claims every `PENDING` item whatever its run (`ClaimWorkHandler` passes no `runId`), so putting an item back to `PENDING` is enough.
- AUTO path: `ServerAiAdapter` only claims items whose `lastRunId` is its own run, and every run today starts with CAPTURE (a billed Apify job). So AUTO re-analysis needs a run that has only the ANALYZE step. Reusing the run machinery keeps what AUTO already has: per-run budget, daily cap, light then deep pass, the 30-minute busy stop, the Runs page with its Spend column, cancel.
- A run belongs to one source today (`radar_runs.sourceId` NOT NULL), while a Feed selection can span sources. Chosen: a run kind `REANALYZE` with `sourceId` nullable (only for that kind). Rejected: one run per source (one budget would be spent N times, and the Runs page would show N rows for one action).

## Acceptance Criteria
- [x] Schema: enum `RadarRunKind { CAPTURE, REANALYZE }`, `radar_runs.kind` default `CAPTURE`, `radar_runs.sourceId` nullable. Both changes are additive (migration via prisma-migrate; the Owner runs `migrate dev`). A `CAPTURE` run still requires a source (entity rule).
- [x] `POST /radar/items/reanalyze` with `{ ids, mode, budgetUsd? }`: `ids` 1 to `RADAR_REANALYZE_MAX_IDS` UUIDs, `mode` `AUTO` (default) or `WORKER`, `budgetUsd` only with `AUTO` (same range as a run, default the server's run budget). Returns `{ requeued, skipped, runId }` (`runId` null for `WORKER`).
- [x] Each eligible item goes back to `PENDING` with `claimCount = 0`, no lease and no `workError`. Skipped and counted in `skipped`: unknown ids; items under a live lease (a worker may still submit); items whose `lastRunId` run is still active (that run will analyze them anyway); items of a paused source (the claim never takes them).
- [x] `AUTO`: one `REANALYZE` run (flow AUTO, the server adapter, the budget) is created with only the ANALYZE step, and the requeued items get `lastRunId` = that run, so the existing tick analyzes them (light, then deep for those that score high enough). When no item is eligible, no run is created. When the AI provider has no key, `AUTO` is refused with the same error as creating an AUTO run.
- [x] The deep pass of a run counts and picks only items its own light pass finished (`workStatus = DONE`), so an old deep enrichment does not use up the run's deep quota and an old high light score does not skip the light pass.
- [x] `WORKER`: no run; the items wait for the next `/radar work`.
- [x] A `REANALYZE` run does not count as a capture: the New run dialog's default window start ignores it, and nothing that assumes a run has a source breaks (Runs page, run detail, run queries). The Runs page shows it as "Re-analysis" with its item count and Spend.
- [x] The item keeps its current enrichment while it waits; the next analysis replaces it (`saveEnrichment` as today). Meanwhile the Feed row and the Detail page show "Re-analysis queued", and the Feed status filter puts it under Pending, not Analyzed.
- [x] Detail page: a "Re-analyze" action in the record header, hidden while the item is already waiting. It opens a small confirm dialog: mode (Auto selected; Claude Code as the other choice), AI budget for Auto (in the display currency, as in the New run dialog). Auto is disabled with a one-line reason when the server has no AI key, and Claude Code is then selected.
- [x] Feed, Table view only: a "Select" toggle in the toolbar turns bulk mode on and off. The checkbox column exists only while bulk mode is on (never shown permanently); turning it off clears the selection. In bulk mode: a checkbox per row and a "select all on this page" checkbox. The selection survives paging, sorting and changing filters or tabs. A bar shows "N selected", "Re-analyze" (same dialog, with the count) and "Clear". After sending, a toast gives `requeued` and `skipped` (and links to the run for Auto), the selection clears and the page reloads. Switching to Split view keeps the selection but hides the checkboxes and the bar.
- [x] Selecting past `RADAR_REANALYZE_MAX_IDS` (one constant in `@portfolio/shared/types`, used by the API schema and the console) is refused with a short message naming the cap.
- [x] Specs: handler (eligible reset, each skip reason, AUTO creates one run and links items, no run when nothing is eligible, no key refused, WORKER creates no run, schema bounds), run entity (REANALYZE has only ANALYZE, CAPTURE needs a source), advance command (a REANALYZE run goes straight to ANALYZE), repository integration for the requeue update. Feature guide updated (Feed bulk action, Detail action, endpoint row, REANALYZE run, "Re-analysis queued").

## Technical Notes
- API: `ReanalyzeItemsCommand` in `application/commands/`; schema next to `TriageItemsSchema` in `radar.dto.ts`; requeue method next to `requeueStuck`. Item requeue and run creation in one transaction so a failed run insert leaves no item pointing nowhere. Controller only forwards (apps/api CLAUDE.md).
- Run entity: a `reanalyze` factory next to the capture one, steps `[ANALYZE]`; `RadarRun.PIPELINE` and `currentStep` already walk whatever steps exist. Reuse the AUTO checks from `run.create.command.ts` (key configured, default budget) rather than copying them.
- `itemCap` on a REANALYZE run = number of items requeued; `captureAdapter` gets a neutral value (for example `none`), check what reads it.
- "Waiting for re-analysis" needs no new column: `workStatus <> DONE` with an enrichment present. Check the Feed `status` filter (`statusWhere` in `radar-item.repository.ts`) and the presenters for every place that treats "has enrichment" as "analyzed".
- Cap: 200, the same for the selection and for one request, so the console never splits a request.
- Selection pattern to reuse: `media.trash` (a `Set` of ids in a signal, `setHas` pipe, header checkbox with indeterminate). No template method calls.
- Console: read `.context/design/cookbook/console.md`, `.context/design/cookbook/forms.md`, `.context/angular-style-guide.md`, `.context/design/patterns/record-detail-layout.md` before the markup. Reuse the budget field logic of `radar-run.create.dialog` (range validator, currency conversion) instead of copying it: extract a small shared helper if both dialogs need it.

**Specialized Skill:** prisma-migrate, for the run kind and nullable source.
**Specialized Skill:** be-test, for the handler, entity and repository specs.

## Files to Touch
- apps/api/prisma/schema.prisma (+ migration)
- libs/shared/utils/types/src/lib/radar.types.ts
- apps/api/src/modules/radar/domain/entities/radar-run.entity.ts (+ spec)
- apps/api/src/modules/radar/application/radar.dto.ts, commands/reanalyze-items.command.ts (+ spec), commands/run.create.command.ts, commands/run.advance.command.ts, queries for runs, commands/index.ts, radar.module.ts
- apps/api/src/modules/radar/infrastructure/repositories/*.ts (+ integration spec)
- apps/api/src/modules/radar/presentation/radar-admin.controller.ts
- libs/console/feature-radar/src/lib/radar.service.ts, radar.types.ts, radar.data.ts, radar-run.util.ts, radar-item.list/**, radar-item.detail/**, radar-item.detail-card/**, radar-run.list/**, new radar-item.reanalyze-dialog/**
- .context/guides/radar-feature-guide.html, .context/progress.md

## Dependencies
- None (418 done).

## Complexity: L

## Progress Log
- 2026-10-07 Started. Owner decisions: a REANALYZE run has only ANALYZE (no transcript catch-up: since 421 ENRICH writes transcripts in AUTO runs, but a re-analysis reuses what is stored); items of a paused source are skipped. Found: `countDeep`/`findDeepCandidates` ignore `workStatus`, AC added.
- 2026-10-08 Feed bulk mode done (Select toggle in the triage bar, Table view only, shared `console-bulk-action-bar`). The toast names the Runs page instead of linking the run: `ToastService` has no action/link support. Specs and feature guide still open.
- 2026-10-08 Specs written (entity 2, handler 4, schema 4, advance 1, integration 3; radar suite 51/292 green), feature guide updated (`#reanalyze`, Runs page row, endpoint row, status badge, deep pass rule, gap row). API tsc app+spec clean, `nx build console` green. Open: the bulk AC's "links to the run for Auto" (toast has no link support), Owner to decide.
- 2026-10-08 Owner chose to extend the shared toast: `ToastService` methods take `number | ToastOptions` (additive: `action: { label, link }`), `ToastContainer` renders the action as a router link that also closes the toast. The Auto re-analysis toast links to `/radar/runs` (task 426 can point it at the run detail page). All ACs done.
- 2026-10-08 Done, all ACs satisfied
