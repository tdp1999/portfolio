# Epic: Landing Checklist (private work checklists on thunderphong.com)

## Summary

A private `/checklist` area on the landing site where the Owner runs the work checklists from `~/Code/personal/learning/workflow/`. The markdown files stay the source of truth for **templates** (lane S/M/L), the **lookup table** (`bang-tra.md`) and the **project profiles** (`projects/*.md`). A push script parses nothing itself: it sends the raw files to the API, which parses and stores them. From a template the Owner creates a **run** (a snapshot clone for one ticket) and works it on the web: tick, skip, drag, note, add, edit, delete. Login reuses the console account (email + password) through the landing's same-origin `/api` proxy.

## Why

The checklists are the main artifact of the new-job workflow (onboarding ~Nov 2026) and change often. Today they are plain markdown in a local repo: no per-ticket state, no access from another machine, and the tables are hard to read and tick in an editor. A web view on the Owner's own site makes them usable daily, and closes the README open item "làm checklist thành web UI tùy biến trên trang portfolio".

## Target Users

The Owner only. Single user, authenticated. No public visitor ever sees checklist data.

## Scope

### In Scope

- **Docs sync**: `pnpm checklist:push` reads `learning/workflow/` (`checklist-lane-*.md`, `bang-tra.md`, `projects/*.md` except `_template.md`) and posts the raw files to the API with a machine token. The API parses and upserts by slug; a doc whose file disappeared is archived (hidden from "new run", existing runs untouched).
- **Parser** for the checklist dialect: intro prose, phases (`## N. Name | Role`), gate line (`**Qua pha khi:** ...`), task rows (`✔ | Việc | Ai làm | Ai kiểm`), group rows (bold, no checkbox) with `↳` children, inline refs `tra X` and `📁 §N`. Lookup table and profiles parse into sections keyed by letter / number.
- **Runs**: create from a template + project (both required) with a name. Status: active, done, archived. Snapshot: later template pushes never change an existing run.
- **Run page**:
  - Row state: todo, done (checkbox), skipped (hover shows a small × at the end of the row; click marks it done-as-skipped, rendered distinctly).
  - Drag and drop rows within and across phases; dragging a group moves its children.
  - Plain-text note per row, no history.
  - Add a row (text only, no doer/checker), edit row text, delete row.
  - Filter by "Ai làm" / "Ai kiểm" role: non-matching rows are dimmed, never removed.
  - Ref chips: `tra B` opens lookup section B, `📁 §6` opens section 6 of the run's project profile, in a read-only side panel.
  - Autosave.
- **Landing auth**: login form on landing (console credentials), access token in memory, refresh via cookie + CSRF header, route guard, logout.
- **DDL options**: a `/ddl/checklist` page with 2 to 3 layout options for the run page, picked by the Owner before the real page is built. Landing visual language.

### Out of Scope

- i18n: no `LANDING_COPY`, Vietnamese/English as-is. Checklist content is rendered exactly as written.
- Template drift handling: no badge, no merge, no re-sync of runs.
- Skip counting / statistics for the "bỏ qua 3 lần thì xóa" rule.
- Editing templates, lookup table or profiles on the web (edit the markdown, then push).
- Keyboard drag and drop (CDK drag-drop is pointer/touch only); phase gates as a separate action; ticket links; multi-user; note history.

## High-Level Requirements

1. When the push script runs with a valid machine token, the API shall upsert every posted file as a doc keyed by its slug.
2. When a previously synced file is absent from a push, the API shall archive that doc and shall leave every run created from it unchanged.
3. If a posted checklist file has no parsable phase, then the API shall reject that file with its path in the error and shall not write any doc from that push.
4. When the Owner creates a run from template T and project P, the system shall copy T's current phases and rows into the run.
5. When a template is pushed again, the system shall keep the rows of every existing run unchanged.
6. When the Owner clicks the × on a todo row, the system shall mark the row skipped, and the progress count shall include it as complete.
7. When the Owner drags a group row, the system shall move the group's child rows with it.
8. When a role filter is active, the run page shall dim rows whose doer and checker both differ from the role, and shall keep them in the list.
9. When the Owner clicks a `tra X` chip, the side panel shall show section X of the lookup table; when the Owner clicks a `📁 §N` chip, it shall show section N of the run's project profile.
10. If a request to any checklist endpoint has no valid access token, then the API shall return 401.
11. If an unauthenticated visitor opens `/checklist`, then the landing shall show the login form and shall not render any checklist data in server HTML.
12. If a run save carries a stale version, then the API shall return 409 and the page shall tell the Owner to reload.

## Technical Considerations

### Architecture

- **API**: new `checklist` module, Controllers → Services → Repositories. Two controllers: `checklist-sync.controller` (machine token, reuse the radar `MachineTokenGuard` pattern with its own token hash) and `checklist.controller` (user JWT guard, same as console endpoints).
- **Parser** lives in the API (unit tested, one place). The push script stays a thin file reader + POST.
- **Landing**: new lib `libs/landing/feature-checklist` (create via `ng-lib`). Routes `/checklist` (runs list + create) and `/checklist/:id` (run). Both `RenderMode.Client` in `app.routes.server.ts`, `noindex` meta plus `X-Robots-Tag: noindex` header, excluded from sitemap and nav. No `Disallow` in robots: a blocked URL is never fetched, so its noindex is never seen.
- **Landing auth**: a small auth service in the feature lib (cannot import `libs/console/*`). Login `POST /api/auth/login`; refresh `POST /api/auth/refresh` with `x-csrf-token` read from the `csrf_token` cookie; interceptor attaches the bearer token to `/api/checklist*` only.
- **UI**: `landing-*` components only, no Material. `@angular/cdk/drag-drop` (already installed). Row text is inline markdown (bold, code) rendered safely.

### Dependencies

- Prod `COOKIE_DOMAIN=.thunderphong.com` (confirmed) so the refresh cookie set through the landing proxy is valid on `thunderphong.com`.
- New API env var for the checklist machine token hash (Railway) + the raw token in the push script's local env.
- Prisma migration via `prisma-migrate`.

### Data Model

- `ChecklistDoc`: `id`, `kind` (template | lookup | project), `slug` (filename stem), `title`, `content` (parsed JSON), `sourceHash`, `archivedAt?`, timestamps.
- `ChecklistRun`: `id`, `name`, `templateSlug`, `templateTitle` (snapshot), `projectSlug`, `status`, `body` (JSON: intro, phases → rows → children; row = id, kind, text, doer, checker, state, note, refs), `version` (int, optimistic lock), timestamps.
- Rows stored as JSON on the run, not as a table: every drag/add/delete is one save. Lookup and profile sections are read live from `ChecklistDoc` (they change while a ticket is in flight, and they are read-only on the web).

## Risks & Warnings

⚠️ **Landing proxy drops cookies**
- `apps/landing/src/server.ts` copies upstream headers with `res.setHeader` in a loop, so with two `Set-Cookie` headers (login sets refresh + CSRF) only the last survives.
- Fix first: forward `upstream.headers.getSetCookie()` as an array. Verify both cookies in the browser after login.

⚠️ **First authenticated surface on a public site**
- A mistake leaks work notes about the new employer.
- No SSR of data, guard on every endpoint (AC 10), `noindex`, and a manual check that `curl https://thunderphong.com/checklist` contains no run data.

⚠️ **i18n rule exception**
- `LANDING_COPY` is mandatory for landing strings, and `landing-copy-contract.spec.ts` may scan new files.
- Log a one-line ADR scoping the exception to `feature-checklist`; adjust the spec's scope if it flags the lib.

⚠️ **Parser fragility**
- The markdown is hand-edited and will evolve; an unexpected shape could silently drop rows.
- Parser fixtures are the three real lane files; the push fails loudly (AC 3) instead of writing a partial doc.

⚠️ **Two-tab overwrite**
- Whole-body saves mean the last tab wins. The `version` check (AC 12) turns that into a visible 409.

⚠️ **Appetite (2 days)**
- Cut order if late: side panel refs for profiles → DDL to one option → role filter. Never cut auth or the proxy fix.

## Alternatives Considered

### Database as template source of truth (edit on web, export markdown)
- **Pros:** one place, no push step.
- **Cons:** templates are already authored with Claude in markdown; a web editor for this dialect is days of work.
- **Why not chosen:** the Owner keeps editing markdown; push is one command.

### Passcode or secret link instead of login
- **Pros:** no auth code on landing.
- **Cons:** a leaked link exposes everything; no revocation.
- **Why not chosen:** work data needs real auth, and the console account already exists.

### Parse markdown in the push script, send JSON
- **Pros:** API stays dumb.
- **Cons:** parser untested in CI, validation split across two places.
- **Why not chosen:** parsing in the API keeps one tested source.

### One table row per checklist item
- **Pros:** queryable, granular updates.
- **Cons:** reorder across phases and group moves become multi-row transactions.
- **Why not chosen:** single user, no cross-run queries needed; JSON body is enough.

## Specialized Skills

- **prisma-migrate**: schema + migration → 429
- **be-test**: parser, sync, version, snapshot tests → 429
- **ng-lib**: create `libs/landing/feature-checklist` → 431
- **design**: layout options + taste pass → 432
- **playwright-skill**: screenshots and interaction checks → 432, 434

## Success Criteria

- [ ] `pnpm checklist:push` syncs all workflow files; deleting a lane file and pushing hides it from "new run" while its runs still open.
- [ ] The Owner logs in on `thunderphong.com/checklist`, creates a run from lane L + project `portfolio`, and every phase, group and row of `checklist-lane-l.md` appears.
- [ ] Tick, skip (×), drag across phases, note, add, edit, delete all persist across a reload and on a second device.
- [ ] `tra B` and `📁 §6` open the right sections in the side panel.
- [ ] Logged out, `/checklist` server HTML contains no run data and the page carries `noindex`.
- [ ] The Owner picked a layout option on `/ddl/checklist`.

## Estimated Complexity

M

**Reasoning:** about 6 tasks; new module + migration + parser + first landing auth + one dense interactive page. Fits 2 days only with the cut order above.

## Status

broken-down

Broken down into tasks 429-434 on 2026-10-08.

## Created

2026-10-08
