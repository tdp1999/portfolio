# Task: Sweep & fix pre-existing test + lint failures across the monorepo

## Status: pending

## Goal
Run a full-monorepo audit (unit + e2e tests, lint) to enumerate every currently-failing check, classify each, and fix them group by group — without changing production behavior unless a failure is a genuine bug.

## Context
Task 380 (shared-ui structure refactor) is done and verified. Running the full test suite
afterwards surfaced a batch of failures that are **pre-existing** — proven byte-identical to
`HEAD` and unrelated to the refactor (only one true regression, an `rx/` spec import path, was
found and fixed under 380). These need a dedicated cleanup task rather than riding on 380.

**Known failures already observed (starting list, NOT exhaustive — the task must re-scan):**

| # | Where | Symptom | Likely class |
|---|-------|---------|--------------|
| 1 | `libs/landing/shared/ui/src/components/segmented/segmented.spec.ts` (10 tests) | `ReferenceError: ResizeObserver is not defined` (thrown from `scroll-edge-fade.directive.ts`) | env — missing jsdom polyfill in landing `test-setup.ts` |
| 2 | `libs/console/shared/ui/src/components/scrollspy-rail/scrollspy-rail.spec.ts` (1) | `TypeError: railComponent.activeId.set is not a function` | test-drift — `activeId` is now an `input()` (readonly); test should use `fixture.componentRef.setInput` |
| 3 | `libs/console/shared/ui/src/components/asset-upload-zone/asset-upload-zone.spec.ts` (5) | `ReferenceError: DataTransfer is not defined` | env — missing jsdom global in console `test-setup.ts` |
| 4 | `libs/console/feature-admin/src/lib/users/users.spec.ts` (8) | assertion mismatch: component now sends `sortBy: 'updatedAt', sortDir: 'desc'` | test-drift — expectations not updated for default sort |
| 5 | api: `reorder-about-failures.spec.ts`, `reorder-about-principles.spec.ts`, `app.integration.spec.ts`, `auth.integration.spec.ts` (4 suites fail to run) | `SyntaxError: Unexpected token 'export'` from `@phuong-tran-redoc/document-engine-core/src/index.js` (ESM `export *`) | config — jest api `transformIgnorePatterns` doesn't transform this ESM dep |
| 6 | api: `libs/.../skill/application/skill.dto.spec.ts` (1) | `ReorderSkillsSchema` `.success` expected `true`, got `false` | code-or-test — Zod v4 schema behavior; decide which side is wrong |

## Acceptance Criteria
- [ ] Full unit-test sweep run: `nx run-many -t test` across **every** FE project **and** `nx test api`; results captured (with ANSI stripped) to a log.
- [ ] E2E sweep: locate every e2e project (`nx show projects --type app` / `*-e2e`), run them (or explicitly document why any can't run locally, e.g. needs a running server — do NOT auto-start landing/console dev servers per CLAUDE.md).
- [ ] Lint sweep: `nx run-many -t lint` across every project; results captured.
- [ ] A complete, deduped inventory of every failing check is produced, each tagged with a class: **env** (missing test global/polyfill) / **test-drift** (spec out of sync with code) / **config** (jest/eslint config gap) / **code-bug** (real defect).
- [ ] Each group fixed:
  - env → add polyfills to the relevant `test-setup.ts` (e.g. `ResizeObserver`, `DataTransfer`), or shared test setup if it recurs.
  - test-drift → update specs to match current component contracts (`setInput` for `input()`, updated assertions) — only when the current production behavior is correct.
  - config → fix jest `transformIgnorePatterns` (or `moduleNameMapper`) so ESM deps like `@phuong-tran-redoc/document-engine-core` transform; fix any eslint config gaps.
  - code-bug → fix the source, add/adjust a regression test, and call it out explicitly (this is the only category allowed to change production behavior).
- [ ] Re-run the full sweep: **0 failing test suites, 0 failing tests, 0 lint errors** (or any residual is explicitly documented as out-of-scope with rationale).
- [ ] No production behavior changed except where a failure was classified `code-bug` (each such change listed in the progress log).

## Technical Notes
- **Classify before fixing.** Structural/path errors (`Cannot find module`) would indicate a real regression; the ones seen so far are assertion mismatches or missing jsdom globals, which are environment/drift, not structure.
- **jsdom globals:** Angular test-setups here are per-lib `test-setup.ts`. Prefer adding polyfills there; if the same global is missing in multiple libs, consider a shared setup import rather than copy-paste.
- **`input()` signals:** in tests, set them via `fixture.componentRef.setInput('activeId', 'work')`, not `.set()` — the latter only works on writable signals.
- **document-engine-core ESM:** the dep ships raw ESM at `src/index.js` (`export * from './constants'`). The api jest config must either add it to `transformIgnorePatterns` allowlist (so it's transformed) or map it. Cross-check with `document-engine-no-consumer-coupling` memory — keep the fix on the portfolio/jest side, do not modify the published package.
- **`skill.dto` ReorderSchema:** inspect the schema vs the test to decide which is correct (Zod v4 syntax per CLAUDE.md — `z.email()` etc.). If the schema is wrong it's a `code-bug`; if the test asserts stale behavior it's `test-drift`.
- **Do NOT start dev servers** (`pnpm dev:landing`/`dev:console`/`nx serve`) — e2e that needs a live server must be flagged for the user to run, per CLAUDE.md guardrail.
- Delegate the broad sweep/enumeration to the test-runner / Explore subagents where useful; keep the classification and fixes in the main flow.

## Files to Touch
_(discovered during sweep; starting candidates)_
- `libs/landing/shared/ui/src/test-setup.ts`
- `libs/console/shared/ui/src/test-setup.ts`
- `libs/console/shared/ui/src/components/scrollspy-rail/scrollspy-rail.spec.ts`
- `libs/console/feature-admin/src/lib/users/users.spec.ts`
- `apps/api/jest.config.cts` (or the shared jest preset) — `transformIgnorePatterns`
- `apps/api/src/.../skill/application/skill.dto.spec.ts` and/or the `ReorderSkillsSchema` source

## Dependencies
None (follows 380, but independent — 380 is already done/verified).

## Complexity: M

**Reasoning:** No single fix is large, but the surface is wide (multiple libs + api + e2e + lint) and
requires a careful sweep + classification pass before touching anything. Fixes are mostly test-setup /
spec / jest-config edits; at most one may be a small production bug. 2–3 hours.

## Progress Log
