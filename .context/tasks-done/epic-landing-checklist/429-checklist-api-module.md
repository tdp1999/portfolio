# Task: Checklist API module (schema, parser, docs sync, runs)

## Status: done

## Goal
The API stores workflow markdown as parsed ChecklistDocs and serves Owner-only ChecklistRuns.

## Context
Epic `epic-landing-checklist`, day 1. Foundation for every other task. The workflow markdown lives in `~/Code/personal/learning/workflow/` (`checklist-lane-{s,m,l}.md`, `bang-tra.md`, `projects/*.md`). Domain: Checklist glossary, flows "Sync Checklist Docs" + "Work a Checklist Run", rules CHK-001..005.

Markdown dialect the parser must read (see `checklist-lane-l.md`):
- Intro prose before the first `## ` (roles legend etc.), kept as markdown.
- Phase heading `## N. Name | Role` → `{ number, name, role }`.
- Gate line `**Qua pha khi:** ...` → `gate`.
- Table `| ✔ | Việc | Ai làm | Ai kiểm |`: a row with `[ ]` is a task; a row with an empty ✔ cell and bold text is a group; following rows whose text starts with `↳` are that group's children.
- Inline refs in row text: `tra X` (one capital letter, may list several: "tra A, tra F") and `📁 §N` (may list several: "📁 §3, §6").
- Trailing prose after a phase (e.g. "**Gặp bug ở bất kỳ pha nào:** tra E") kept as phase/doc footer markdown.
- `bang-tra.md` → sections keyed by letter (`## A. ...`); `projects/<x>.md` → sections keyed by number (`## 6. ...`).

## Acceptance Criteria
- [x] Parsing `checklist-lane-l.md` (fixture copied verbatim) shall yield 8 phases, and phase 3 shall contain 2 groups whose `↳` rows are their children (unit test).
- [x] Parsing a row "... (tra G) + ... · 📁 §4" shall yield refs `[{kind:'lookup',key:'G'},{kind:'project',key:'4'}]` (unit test).
- [x] If a template file has no parsable phase, then `POST /api/checklist/sync` shall return 400 naming that file and shall write no doc.
- [x] When sync omits a slug that exists, the API shall set that doc's `archivedAt`; runs made from it shall still load (CHK-002).
- [x] If the sync request lacks the checklist machine token, then the API shall return 401 (CHK-004).
- [x] When the Owner creates a run from template T + project P, the run body shall equal T's phases with every row `state: 'todo'`, `note: ''`; a later sync of T shall leave that body unchanged (CHK-001).
- [x] If a run is created from an archived template, then the API shall return 400 (CHK-002).
- [x] If `PUT /api/checklist/runs/:id` carries a `version` lower than stored, then the API shall return 409 and shall not write.
- [x] If any `/api/checklist/*` endpoint except sync is called without a valid access token, then the API shall return 401 (CHK-004).
- [x] Prisma migration applied locally; `tsc` clean for `apps/api`.

## Technical Notes
- Module layout follows `.context/patterns-architecture.md` (Controllers → Services → Repositories) and the radar module as the closest reference.
- Two controllers: `checklist-sync.controller.ts` with a machine-token guard (copy the radar `MachineTokenGuard` pattern: sha256 hash from env `CHECKLIST_SYNC_TOKEN_HASH`, `timingSafeEqual`; reject all when unset) and `checklist.controller.ts` with `@UseGuards(JwtAccessGuard, RoleGuard)` like `radar-admin.controller.ts`.
- Endpoints: `POST sync` (body `{ files: [{ path, content }] }`), `GET docs?kind=`, `GET docs/:slug` (lookup/project sections for the side panel), `GET runs`, `POST runs`, `GET runs/:id`, `PUT runs/:id` (whole body + version), `PATCH runs/:id` (name/status), `DELETE runs/:id`.
- Models: `ChecklistDoc { id, kind, slug @unique, title, content Json, sourceHash, archivedAt?, timestamps }`, `ChecklistRun { id, name, templateSlug, templateTitle, projectSlug, status, body Json, version Int, timestamps }`.
- Run body JSON type + Zod schema in `libs/shared/types` (Zod v4) so landing shares it. Row ids: generated at parse/create time (stable within the run).
- Validate the PUT body with Zod; reject unknown row states.
- Sync is all-or-nothing in one transaction. Slug = file stem; kind from path (`checklist-lane-*` → template, `bang-tra` → lookup, `projects/*` → project, skip `_template`).
- No markdown rendering on the server; store row text as raw inline markdown.

**Specialized Skill:** prisma-migrate — schema change + migration
**Specialized Skill:** be-test — focus tests on parser, sync archive logic, version check, snapshot rule

## Files to Touch
- apps/api/prisma/schema.prisma (+ migration)
- apps/api/src/modules/checklist/** (new)
- apps/api/src/app.module.ts (register module)
- libs/shared/types/src/** (checklist types + schema)
- apps/api/.env.example (`CHECKLIST_SYNC_TOKEN_HASH`)

## Dependencies
- None

## Complexity: L

## Progress Log
- [2026-10-08] Started. Using be-test for spec planning, prisma-migrate for the migration. Mismatches vs task: CQRS (not services), Zod schemas stay in API dto (shared types lib has no zod), own machine-token guard, root module at apps/api/src/app/app.module.ts. Nest body limit 100KB is enough today (md total 44KB).
- [2026-10-08] Module written (parser in application/, CQRS handlers, own sync-token guard). Migration `20261008104813_20261008_checklist_docs_and_runs` reviewed (additive only) and applied by the Owner. 34 unit tests green; 3 deliberate mutations (lookbehind, progress rule, version check) each turned a test red. `tsc` clean for apps/api. Outstanding: AC 4 (archived doc's run still loads), AC 6 second half (re-sync leaves run body unchanged), AC 9 (401 without access token) need a curl pass against a running local API. `.env.example` entry for `CHECKLIST_SYNC_TOKEN_HASH` left to the Owner (no reading `.env*`).
- [2026-10-08] Curl pass against the local API (Owner started it, set the local hash): full sync created 6 docs; no token → 401 on sync, no JWT → 401 on runs/docs, sync token on runs → 401; run from lane M = 9 phases / 34 tasks; save → version 2, same save again → 409; sync without lane M + bang-tra archived both, the run still opened with its saved state, a new run from lane M → 400, archived bang-tra still readable; edited lane S pushed → doc updated, run body byte-identical (CHK-001); restore sync revived both; bad run id → 404. Smoke runs deleted, local docs left synced with the real folder.
- [2026-10-08] Done — all ACs satisfied
