# Task: Migrate FE file/folder naming to patterns-file-structure standard

## Status: in-progress (mechanical migration + enforcement done & build-verified; commit pending)

## Goal

Big-bang migrate all frontend files/folders to the naming grammar defined in
`.context/patterns-file-structure.md`, and land the lint + generator enforcement that keeps new code
conformant — in one atomic, mechanical commit.

## Context

File/folder naming across the FE was inconsistent: `.component` suffix used in some libs and dropped
in others, no page/screen marker, `components/` buckets in some feature libs but not others, and
`shared/ui` split between flat `/src` (landing) and nested `/src/lib` (console). The agreed standard
is fully specced in **`.context/patterns-file-structure.md`** (read it first — it is the single
source of truth for this task). Key rules:

- Filename grammar: `<entity>.[variant].<role|kind>.[spec].<ext>` — dot = structural boundary,
  dash = word-joiner within a segment.
- Drop `.component`; keep high-information kind-suffixes (`.service/.store/.guard/.pipe/.directive/
  .types/.routes/.constants/…`).
- `role` and `variant` come from a controlled vocabulary (§5) — lint-enforced via allowlist.
- One folder per component (folder name === base, dots and all); single-file artifacts flat at
  `src/` root; no `components/` bucket.
- `shared/ui` standardizes on flat `/src` (drop `/src/lib`).
- WHERE (app/screen) is carried by path + import-path + selector prefix — never the filename.

**Scope: FE only** (`apps/landing`, `apps/console`, `libs/landing/**`, `libs/console/**`,
`libs/shared/**`). The NestJS API already follows DDD/hexagonal naming and is documented as-is in
§9 — **do not touch it**.

**Ordering constraint:** enforcement (lint rule + generator update) must land **before or in the
same commit as** the rename — otherwise freshly-cleaned code drifts again immediately.

## Acceptance Criteria

### Gate 0 — vocab sign-off (before any code)
- [x] Role/variant vocabulary in `patterns-file-structure.md` §5 reviewed and signed off; allowlist in
      `tools/eslint/fe-naming.mjs` mirrors it (kept-kinds extended with provider/validator/util/server/
      data/matcher, confirmed against the real tree).

### Enforcement (lands before/with rename)
- [x] ESLint filename-grammar rule (`fe-naming/filename-grammar`) — no legacy suffix, dash-joined
      segments, console role/variant/kind allowlist mirroring §5. Custom local plugin.
- [x] ESLint rule (`fe-naming/decorator-name-agreement`) — file-base ↔ class ↔ selector agree (§6).
      Both rules **error** level, scoped to landing+console; 0 findings on the migrated tree.
- [x] `@nx/enforce-module-boundaries` confirmed still strict (scope/type tags) — config untouched.
- [x] `ng-lib` / component generator: `nx.json` `@nx/angular:component` → `type: ""` (no `.component`
      suffix), `OnPush`, `scss`; dry-run verified (`sample-thing.ts`, folder-per-component). `ng-lib`
      skill documents the grammar-correct path.

### Codemod + rename
- [x] `ts-morph` codemod inventories every FE component and **emits `fe-naming-map.csv`**
      (`tools/codemods/fe-naming-inventory.mjs` + `fe-naming-rename.mjs`).
- [x] **Mapping CSV reviewed** (user approved; DDL included; sidebar/shared kept; 220 rename / 43 keep).
- [x] Files/folders renamed via `git mv`-equivalent (ts-morph `sf.move()`) into folder-per-component
      dotted layout — 483 renames, git history preserved, 0 data loss. 62 empty husk folders + 29 DDL
      orphan barrels removed.
- [x] References updated by AST: imports, `templateUrl`/`styleUrl`, `index.ts` barrels, class names
      (rename-symbol), selectors in `.ts` + `.html`. 8 class↔file mismatches resolved
      (`fe-naming-class-fixups.mjs`: 2 data-types suffixed `…Data`, 6 classes → bare name). One real
      stray selector fixed (`landing-ddl-blog-share-row` → `landing-blog-share-row`). `feature-about`
      `components/` bucket lifted; stray `failures-content.ts` → `about.failures.types.ts`.
- [x] `shared/ui` flattened `/src/lib` → `/src`: `libs/console/shared/ui` moved (33 component folders up,
      barrel `./lib/` → `./`); landing shared/ui already flat. Build green. Global `libs/shared/**`
      (vendored sidebar port) intentionally still out of scope.

### Verify + commit
- [x] Build green (used instead of `tsc -p base`, which lacks Angular module-resolution): `nx build
      landing` + `nx build console` both exit 0.
- [x] `fe-naming` lint clean (0 findings); `@nx/enforce-module-boundaries` unaffected.
      ⚠ `nx test` (unit) not yet run for the rename.
- [x] Selectors verified by build (no orphaned tags; element-selector rewrites compiled).
- [ ] One atomic commit + `.git-blame-ignore-revs` — **PENDING** (user holding commit for review).

## Technical Notes

- **AST over regex** — regex rename breaks imports/templateUrl/selector. Use `ts-morph` for `.ts`
  and cross-update `.html` selector usages.
- **Selector change is breaking** — any hardcoded tag in a template must be updated; the build is the
  verification, not manual inspection.
- **Run when no PRs/branches are open** — minimizes rebase/merge hell on a repo-wide rename. Confirm
  timing with the user before executing.
- **`.git-blame-ignore-revs`** — add the rename commit hash; optionally set
  `git config blame.ignoreRevsFile .git-blame-ignore-revs` locally and note it in the repo.
- Standard reference: `.context/patterns-file-structure.md` (all sections). Macro context:
  `patterns-architecture.md`. Angular syntax: `angular-style-guide.md`.
- Do NOT start the landing/console dev server to verify — use `nx build`/`tsc`, or a server the user
  already has running (per CLAUDE.md). New routes/lazy chunks need a fresh server start — flag it.

## Files to Touch

- `.context/patterns-file-structure.md` (vocab §5 final tweaks only)
- New: codemod script (e.g. `tools/codemods/rename-fe-naming.ts`) + emitted mapping CSV
- New: ESLint filename-grammar rule + allowlist config (`eslint.config.*` / rule package)
- `nx.json` and/or generator/schematics config; `ng-lib` skill + component generator
- Repo-wide under `libs/landing/**`, `libs/console/**`, `libs/shared/**`, `apps/landing/**`,
  `apps/console/**`: component `.ts`/`.html`/`.scss`/`.spec.ts`, `index.ts` barrels
- `.git-blame-ignore-revs` (new)

## Dependencies

None (standard doc `patterns-file-structure.md` already authored). BE explicitly out of scope.

## Complexity: XL

**Reasoning:** Repo-wide mechanical rename across many libs, plus a custom lint rule, a generator
update, and an AST codemod with cross-file selector/import/class rewrites. High blast radius, must
be verified by full `nx affected` build. Several human gates (vocab, mapping CSV, timing).

## Progress Log

- **Gate 0 (vocab §5):** signed off by user.
- **Inventory codemod built:** `tools/codemods/fe-naming-inventory.mjs` (read-only, TS compiler API —
  ts-morph not installed; will add for the rename step). Emits `tools/codemods/fe-naming-map.csv`.
- **Inventory run:** 263 artifacts (234 Component / 16 Directive / 13 Pipe).
  - Excluding the `apps/landing/src/app/pages/ddl/**` showcase tree (44 components / 137 files):
    **219 artifacts → 188 rename, 31 keep, 1 low + 11 med** (med = sensible degenerate containers).
    Production map is clean.
  - DDL showcase is where the heuristic mis-splits vN variants (`currently-shipping-v1` →
    `currently.v1.shipping`); it is internal demo with its own `.page.ts` convention.
- **AWAITING USER (mapping-review gate):** (1) review/edit `fe-naming-map.csv`; (2) decide DDL scope
  — recommend EXCLUDING `pages/ddl/**` from this big-bang (separate follow-up). Only manual edit in
  the production set: `error-page → error` (the word "error" is both a state-role and the entity).
- Next after sign-off: write the rename codemod against the frozen CSV (git mv + AST ref rewrite +
  shared/ui flatten), then verify + atomic commit; land lint rule + generator with/before it.
