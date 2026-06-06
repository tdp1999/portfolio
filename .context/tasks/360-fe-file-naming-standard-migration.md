# Task: Migrate FE file/folder naming to patterns-file-structure standard

## Status: pending

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
- [ ] Role/variant vocabulary in `patterns-file-structure.md` §5 reviewed and adjusted for the real
      console + landing domains; allowlist will mirror it exactly.

### Enforcement (lands before/with rename)
- [ ] ESLint filename-grammar rule asserts `<entity>.[variant].<role|kind>.[spec].<ext>` and that
      `role`/`variant` ∈ the allowlist mirroring §5 (custom rule or `eslint-plugin-check-file`).
- [ ] ESLint rule asserts file-base ↔ class (PascalCase) ↔ selector (`<app>-…`) agree (§6).
- [ ] `@nx/enforce-module-boundaries` confirmed still strict (scope/type tags) — no regression.
- [ ] `ng-lib` / component generator (and `nx.json`/schematics defaults) emit the new shape:
      flat-in-`/src`, dot-named, no `.component` suffix, folder-per-component. New files need no
      manual rename.

### Codemod + rename
- [ ] `ts-morph` codemod inventories every FE component (reads `@Component` selector/templateUrl/
      styleUrl/class), infers `(entity, variant, role)`, and **emits a `cũ→mới` mapping CSV**.
- [ ] **Mapping CSV reviewed and corrected by hand** before applying (ambiguous cases like `ddl.ts`,
      `editor.ts` resolved explicitly). ← human gate.
- [ ] Files/folders renamed via `git mv` into folder-per-component dotted layout (history preserved).
- [ ] References updated by AST (not regex): intra-lib imports, `templateUrl`/`styleUrl`, `index.ts`
      barrels, class names (rename-symbol), and selectors in **both `.ts` decorators and `.html`
      templates** repo-wide.
- [ ] `shared/ui` flattened `/src/lib` → `/src` (landing already flat; console moved); tsconfig
      paths updated if needed.

### Verify + commit
- [ ] `npx tsc --noEmit` clean (or via watch-servers build).
- [ ] `nx affected -t lint test build` green across affected projects.
- [ ] Selectors verified by build/render, not by eye (no orphaned tags in templates).
- [ ] One atomic commit; its hash added to `.git-blame-ignore-revs` (created if absent) so blame
      skips the mechanical rename.

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
