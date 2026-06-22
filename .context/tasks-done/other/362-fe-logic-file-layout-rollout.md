# Task: Roll out FE logic/component file-layout standard

## Status: done

## Goal
Bring every FE `.ts` component/directive/injectable in line with the new file-layout standard (member order, access/readonly, naming, file purity, orphan extraction) — beyond the doc + warning-level lint already shipped.

## Context
FE logic files had no unified internal layout: inconsistent member ordering, mixed access modifiers, orphan `const`/`type`/helper/validator living next to the class. A standard was agreed and the **foundation is already in place** (see "Done this session"). This task tracks the remaining rollout: migrating existing code to clear the new warnings, plus two enforcement gaps (custom file-purity rule, import-sort plugin).

Enforcement is **warning-only by design** — no CI block, no Prettier action, no ts-morph codemod (rejected as too fragile). Migration is incremental.

### Done this session (foundation — do NOT redo)
- `.context/angular-style-guide.md §16` — full layout standard: member order (fields-by-kind, methods-by-cluster), access/`readonly` policy, `on<Event>` handler naming, export style, import order, enforcement note.
- `.context/patterns-file-structure.md §5.5` — component-file purity (only one decorated class + imports at module scope) + orphan→role mapping (`.types`/`.data`/`.constants`/`.util`/`.validator`/`.tokens`) + local-vs-shared decision (reusability) + module-boundary constraint.
- `eslint.config.mjs` — warning-level FE block (landing+console): `@typescript-eslint/member-ordering` (macro order field→constructor→method), `explicit-member-accessibility` (no-public), `naming-convention` (no leading underscore on private), `no-restricted-syntax` (bans `#private`). Verified: contact.ts shows 2 warnings, 0 errors.

## Acceptance Criteria
- [x] Most-complex FE files migrated to the standard, member-ordering warnings cleared: `lightbox-overlay.ts`, `experience.form.ts`, `contact.ts`, `select.ts`, `project.form.ts` (then sweep the rest incrementally).
- [x] Orphan `const`/`type`/helper/validator extracted from migrated files into sibling/shared `.data`/`.types`/`.util`/`.validator` files per §5.5 (validator-arrow fields → `.validator.ts`).
- [x] Custom `fe-file-layout` eslint rule added enforcing: file purity (only one decorated class + imports at module scope), export style (`export default` for routed/`loadComponent`, named otherwise), one-class-per-file. Wired at warning level, scoped landing+console. Role files (`.types`/`.data`/`.util`/etc.) excluded via ignores.
- [x] ~~`eslint-plugin-simple-import-sort` added as devDependency~~ — **dropped**: import order stays doc/convention only (§16.6, §16.7). No external dependency needed; imports sorted by hand during migration.
- [x] `npx eslint` on touched files shows 0 errors, 0 warnings; `npx tsc --noEmit` clean (both landing + console tsconfigs).
- [x] No behavior change — pure structural refactor (spot-check a migrated page renders identically). User spot-checked: renders as before.
- [x] **Repo-wide lint clean (added 2026-06-10).** `pnpm lint` across all projects shows 0 errors, 0 warnings.
  - [x] **Phase 1 — genuine pre-existing issues** (30 errors + ~43 warnings, independent of the new rules): a11y templates (keyboard handlers + `tabindex`/`role`), `table-scope`/`label`/`eqeqeq`/`no-inferrable-types`/`no-irregular-whitespace`, private-field `_`-prefix renames (→ `…Signal` when colliding with a public readonly view), unused-import removal, non-null assertions → safe guards, 2 scoped module-boundary disables. Plus B3 config relaxations (below). Verified: only `fe-file-layout/*` + `member-ordering` warnings remain; both apps `tsc` clean.
  - [x] **Phase 2 — new-rule migration sweep** (done 2026-06-10). Refined `fe-file-layout/file-purity` to fire only on files that contain an Angular-decorated class (§16.1 is "A component file holds only the class" — pure util/types/const modules and functional guards/interceptors have no class to keep pure), clearing ~40 false positives. Migrated the remaining 123 component/directive/service/pipe files: extracted module-scope orphans into `.types`/`.data`/`.util`/`.constants`/`.tokens` siblings (public orphans kept as bare re-exports or barrel-resolved) + reordered members to field→constructor→method. ~160 new sibling role files. **Result: `pnpm lint` across all 38 projects = 0 errors, 0 warnings; both apps `tsc --noEmit` clean.**

## Technical Notes
- Standard is the source of truth: `angular-style-guide.md §16` + `patterns-file-structure.md §5.5`. Do not re-derive.
- `member-ordering` only enforces the macro order — fine field grouping and method clustering are convention, so migration is partly judgment, not just "make the warning go away".
- Custom rule should mirror the existing `tools/eslint/fe-naming.mjs` authoring shape and reuse its FE glob/ignore scope.
- Respect `@nx/enforce-module-boundaries`: extracted helpers from a `shared/ui` component must go to `shared/util`, never `data-access`.
- `on<Event>` naming, `$`-suffix, boolean prefixes are doc-only (not lintable) — apply by hand during migration.

## Files to Touch
- `libs/landing/shared/ui/src/components/lightbox-overlay/lightbox-overlay.ts` (+ new sibling role files)
- `libs/console/feature-experience/src/lib/experience.form/experience.form.ts` (+ `.validator.ts`, `.data.ts`)
- `apps/landing/src/app/pages/contact/contact.ts` (+ `.util.ts`, `.types.ts`)
- `libs/landing/shared/ui/src/components/select/select.ts`
- `libs/console/feature-project/src/lib/project.form/project.form.ts`
- `tools/eslint/fe-naming.mjs` (or new sibling rule) + `eslint.config.mjs`
- ~~`package.json` (add `eslint-plugin-simple-import-sort`)~~ — dropped

## Dependencies
Related to 360 (FE file-naming standard migration) — same standardization family, but independent. No hard blocker.

## Complexity: L

**Reasoning:** Foundation already shipped, but migrating multiple complex files (with judgment-based clustering + orphan extraction), authoring a custom eslint rule, and adding/wiring an import-sort plugin spans many files with some unknowns. Incremental and warning-gated, so low risk but real effort.

## Progress Log
- 2026-06-09: Created. Foundation (doc §16, §5.5 + warning-level lint) shipped same day; this task tracks migration + custom file-purity rule + import-sort plugin.
- 2026-06-09: Started. AC4 (import-sort plugin) dropped — convention-only per user decision. Beginning with custom eslint rule, then 5-file migration.
- 2026-06-09: Done — all ACs satisfied. 12 new sibling role files created; `tools/eslint/fe-file-layout.mjs` written (3 rules: file-purity, export-style, one-class); eslint.config.mjs wired. 0 errors, 0 warnings on all 18 touched files. Both tsconfigs clean. AC5 (behavior check) pending user spot-check.
- 2026-06-10: AC5 confirmed (user spot-check: renders as before). User added a repo-wide-lint-clean AC. Baseline `pnpm lint`: 720 problems — 647 from the two new rules (file-purity 477 + member-ordering 170 = full-FE migration) + ~73 genuine pre-existing (30 errors). Split into Phase 1 (genuine) + Phase 2 (new-rule sweep). **Phase 1 done** via 3 parallel agents + manual reconciliation: all 30 errors + ~43 genuine warnings cleared; both apps tsc clean; only file-purity + member-ordering remain. B3 rule-vs-Angular-idiom conflicts resolved by config (per user): `no-input-rename` off for `*.directive.ts`; `directive-selector` allows `fx`/`lightbox` prefixes; `no-unused-vars` ignores `^_` (`args: after-used`). Phase 2 (157-file sweep) pending.
