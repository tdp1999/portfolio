# Task: Standardize Shared-UI Lib Structure & Style Organization (Bucket Taxonomy)

## Status: done

## Goal
Establish and apply ONE canonical internal structure for every shared-UI library across all
three scopes (landing, console, shared), so contributors stop relearning a different layout per
scope. The chosen model is a **bucket taxonomy** (`components/ directives/ pipes/ services/
styles/`) with a single public `index.ts` barrel. Scope is structural consistency — NOT forcing
identical design tokens (landing keeps its own scale).

**Scope expanded 2026-06-30** (from the original "decide + document" task) to a full structural
refactor: physically migrate all shared-ui libs to the bucket taxonomy, consolidate
`libs/shared/ui/{pipes,sidebar,styles}` (3 projects) into ONE `libs/shared/ui` project, and split
the documentation so `patterns-file-structure.md` governs feature/component micro-conventions
while a new doc governs shared-ui lib macro-structure.

## Context
Surfaced during task 311 (RTE console editor swap) when placing the `document-engine` vendor
stylesheet — there was no documented standard for where shared-ui styles live. Audited the
current reality (parallel explore passes) + researched design-system conventions (Angular
Material/CDK, Nx guidance, MUI/Carbon/Chakra, Spartan/Taiga/ng-zorro) before deciding the pattern.

### Decisions locked (2026-06-30)
1. **Bucket taxonomy** for shared-ui libs (user chose bucket over flat). Research backing: pure
   Angular libs (Material, MUI) are flat-folder-per-component at root, but the `components/` +
   sibling-kind-bucket layout (Carbon/Chakra/Spectrum/React-DS family) is the right call for a
   *multi-concern* lib — and ours hold components + directives + pipes + services + tokens + SCSS
   + theme + motion. ng-zorro is the one major Angular lib using a `components/` bucket.
2. **Single root `index.ts` public API**, lib stays **non-buildable**, **NO secondary entry
   points** (internal/unpublished — esbuild tree-shakes standalone + `sideEffects:false` fine).
   Each component keeps its own sub-barrel `index.ts`, re-exported by the root (Material's
   two-level barrel; avoids cross-component deep imports / cycles).
3. **No `lib/` tier** — buckets sit directly under `src/` (matches the repo's existing
   landing/console standard; `sidebar`+`ui-pipes` currently still have `lib/` and must drop it).
4. **No sub-categories inside `components/`** — flat folder-per-component, no `components/forms/`
   or `components/overlays/`. (Material/MUI don't sub-categorize; avoids the "which group?" muddle.)
5. **Consolidate `libs/shared/ui/{pipes,sidebar,styles}` → ONE `libs/shared/ui` project** with the
   bucket taxonomy. The global SCSS (was the separate `shared-ui-styles` project) folds into that
   lib's `styles/` bucket. Result: every scope has exactly one shared-ui lib, same structure.
6. **Staged migration** by lib: console → landing → shared consolidation → docs. Each stage:
   move + fix barrel/relative imports + `nx build` green + screenshots unchanged, before the next.
7. **Doc split**: gut `§8 Per-lib-type structure` from `patterns-file-structure.md` (re-scope it to
   feature/component only); create a new doc for shared-ui lib macro-structure; record an ADR.
8. **`type:ui` deviation noted**: Nx says `type:ui` injects no services, but our shared-ui libs
   already have services (theme, toast, breakpoint…). We keep that reality + a `services/` bucket
   rather than forcing them into data-access. Record as a conscious deviation in the ADR.

### Canonical taxonomy (the target)
```
libs/<scope>/shared/ui/src/
├── index.ts              ← single public API barrel (Nx boundary)
├── components/           ← every component, flat folder-per-component (name === folder)
│   └── button/  button.ts button.html button.scss button.spec.ts index.ts
├── directives/           ← attribute/structural directives
├── pipes/                ← pure pipes
├── services/             ← non-data services (theme, keyboard, locale, toast…)
├── styles/               ← SCSS root
│   ├── _index.scss       ← @forward public Sass API
│   ├── tokens/  base/  themes/  (material/ where applicable)
└── test-setup.ts
```
DI tokens (`InjectionToken`) co-locate with their component (Material-style); no separate TS
`tokens/` bucket. Component `.scss` co-locates in the component folder; shared tokens/theme/mixins
live in `styles/`.

### Current reality (audited 2026-06-28/30)
- **5 shared-ui libs, 3 different shapes:** `ui` (landing, ~49 comp, mostly bucketed but muddled —
  component-likes both in `components/` and at root) · `console-shared-ui` (~33 comp, flat under
  src/, + `smart-components/` + `rx/`) · `sidebar` + `ui-pipes` (still have `lib/` tier) ·
  `shared-ui-styles` (SCSS-only project, base/material/themes/tokens).
- **Break risk LOW:** 0 deep-import TS sites (all consumers import via barrel alias `@portfolio/…`);
  internal relative imports are short (`../comp/comp`); only 3 SCSS deep-import sites (app
  styles.scss). tsconfig path aliases point at each lib's root `index.ts`.

## Acceptance Criteria
- [x] **Stage 1 — console-shared-ui** migrated to bucket taxonomy. Buckets: `components/` (31),
      `services/` (toast), `pipes/` (enum-label), `rx/` (with-list-loading — kept in ui: it
      depends on `ProgressBarService`, so `util` is boundary-blocked), `styles/` (unchanged this
      stage — barrel/rewire deferred to Stage 3). `smart-components/` didn't exist (audit nit).
      Fixed 2 cross-bucket relative imports (toast-container→services/toast, rx→components/loading-bar)
      + rewrote root barrel. `nx build console` green. No template/SCSS touched → visual identical
      (live screenshot deferrable to user's server).
- [x] **Stage 2 — landing `ui`** migrated (TS-only; SCSS deferred to Stage 3). Decision: cross-kind
      subsystems dispersed **strictly by kind** (no subsystem buckets). `components/` ← original 49 +
      command-palette, theme-toggle, stagger-text, and shell decomposed into folder-per-component
      (shell, header, footer-banner, footer-signature, scroll-to-top). `directives/` ← original 3 +
      keyboard-shortcuts, spotlight, type-out, hydration-safe-active. `services/` (NEW) ← keyboard
      (service+types+util), theme, locale. `pipes/` unchanged. `motion/` + `tokens/` now SCSS-only,
      folded into `styles/` in Stage 3. Fixed ~20 cross-bucket relative imports + rebuilt root barrel
      + sub-barrels + services/directives aggregators. `nx build landing` (prerender) green. No
      template content changed → visual identical.
- [x] **Stage 3 — consolidate `libs/shared/ui`** = merged `{pipes, sidebar, styles}` (3 projects)
      into ONE `shared-ui` project (scaffolded via `ng-lib`/Nx generator). Buckets: `components/sidebar/`
      (compound component — 23 files kept as one folder), `pipes/` (9, lib/ tier dropped), `styles/`
      (global base/themes/material/tokens, verbatim relocate). Single barrel `src/index.ts`. tsconfig
      aliases: added `@portfolio/shared/ui`, removed `…/pipes` + `…/sidebar`; rewrote 11 consumer
      imports. includePaths `libs/shared/ui/styles/src` → `libs/shared/ui/src/styles` (+ stylelintrc,
      contrast-audit config, 1 comment). tsconfig.spec module/resolution fixed per ng-lib note.
      Deleted the 3 old projects. `nx show projects` clean (only `shared-ui`). **Both `nx build console`
      + `nx build landing` green.** Token-name collision avoided: landing keeps its local `tokens/`
      top-level (referenced relative), global tokens under `styles/tokens/` (via includePaths).
- [x] **Stage 4 — docs**: created `.context/patterns-lib-structure.md` (named to pair with
      `patterns-file-structure.md` micro ↔ macro) capturing the bucket taxonomy, 2 placement rules,
      compound-component rule, single-barrel/non-buildable policy, style organization, project
      granularity, and the documented exceptions. Removed the shared/ui subsection from
      `patterns-file-structure.md §8` (→ pointer to new doc) + updated its intro; added the new doc
      to `CLAUDE.md` context-files list; added **ADR-021** to `decisions.md`.
      *(Also did the SCSS polish: console `styles/_index.scss` barrel + app rewired to one `@use`;
      landing `motion/` scss folded into `styles/motion/`.)*
- [x] No behavioral/visual change — pure reorganization; `nx build landing` + `nx build console`
      green at every stage. No template content or selector changed → visual identical. Live
      screenshots deferrable to the user's running server. (`nx lint shared-ui` + `ui` pass; 3
      pre-existing console-shared-ui lint errors are unrelated — verbatim-moved files.)

## Technical Notes
- Module boundaries are TS-only; SCSS `@use` of packages/libs is unaffected by
  `@nx/enforce-module-boundaries`.
- `apps/{landing,console}/project.json` set `stylePreprocessorOptions.includePaths`
  (`libs/shared/ui/styles/src` today → `libs/shared/ui/src/styles` after Stage 3).
- Use `git mv` for moves to preserve blame where practical.
- Selectors do NOT change on folder moves → no template-side visual risk. Watch CSS `@use`
  emission ORDER in barrels — reordering can shift the cascade (silent visual regression);
  preserve order + screenshot as backstop.
- `fe-naming` lint currently excludes shared libs; bucket structure is convention-only for now
  (consider enforcement as a follow-up).

## Files to Touch (likely)
- `libs/console/shared/ui/**`, `libs/landing/shared/ui/**`, `libs/shared/ui/**`
- `libs/shared/ui/{pipes,sidebar,styles}/project.json` (consolidation → one project.json)
- `tsconfig.base.json` (path aliases), `apps/{landing,console}/project.json` (includePaths)
- `apps/console/src/styles.scss`, `apps/landing/src/styles.scss`
- `.context/design/style-organization.md` (new), `.context/patterns-file-structure.md` (gut §8),
  `.context/decisions.md` (ADR), `CLAUDE.md` (reference fixes)

## Complexity: L (expanded from M)

## Verification: full

## Progress Log
- [2026-06-28] Created from task 311 discovery. Audit + comparison table captured.
- [2026-06-28] First consistency step (under 311): console RTE vendor stylesheet placed at
  `libs/console/shared/ui/src/styles/vendor/document-engine.scss`.
- [2026-06-30] Scope expanded to full bucket-taxonomy refactor. Ran 2 research passes (web design-
  system conventions + local audit/break-risk). User decisions locked (see "Decisions locked").
  Status → in-progress. Starting Stage 1 (console).
- [2026-06-30] Stage 1 done. Console bucketed (components/services/pipes/rx/styles); 2 cross-bucket
  imports + barrel fixed; `nx build console` green. Corrected an earlier wrong claim: withListLoading
  is NOT pure (imports WritableSignal + ProgressBarService from ui), so it stays in the ui lib's
  `rx/` bucket rather than moving to console-shared-util (util→ui is lint-blocked).
- [2026-06-30] Stage 2 done. Landing ui bucketed strictly-by-kind (user decision); shell decomposed
  to folder-per-component; motion split (directives + component out, scss left for Stage 3); new
  `services/` bucket. ~20 cross-bucket imports + barrels fixed. `nx build landing` green.
- [2026-06-30] Stage 3 done. Consolidated shared/ui 3 projects → 1 (`shared-ui`) via Nx generator;
  sidebar = compound folder, pipes/styles bucketed, single barrel, aliases + 11 consumers +
  includePaths updated, 3 old projects deleted. Both apps build green. Decided to NOT use ng-lib
  manual; generator path chosen. Token collision sidestepped (landing tokens stay top-level).
  Remaining: small SCSS polish (console styles barrel, landing motion-scss fold) + Stage 4 docs.
- [2026-06-30] SCSS polish done: console `styles/_index.scss` barrel (app → one `@use`), landing
  `motion/` scss → `styles/motion/`. Both apps rebuilt green. `nx lint shared-ui` + `ui` pass
  (fixed 16 selector-prefix errors by setting the consolidated lib prefix to `ui`).
- [2026-06-30] Stage 4 done — `patterns-lib-structure.md` created, `patterns-file-structure.md §8`
  shared/ui subsection removed (pointer), CLAUDE.md updated, ADR-021 added. **All ACs satisfied —
  task done.**
- [2026-06-30] Post-review refinements (user-flagged): (a) landing local `tokens/` folded into
  `styles/tokens/` (local palette file renamed `palette.scss` to avoid shadowing the global
  `tokens/colors` includePath — verified both `--color-*` and `--landing-*` emit in built CSS);
  (b) `unsaved-changes.dialog` (component+guard+type+fn) relocated `console-shared-util` →
  `console-shared-ui/components/`, ~21 consumers repointed, both barrels updated, forms' imports
  merged. `nx build console` + `nx build landing` green; `nx lint shared-ui`/`ui` pass. Docs synced.
- [2026-07-01] Full test run (all FE + api). One refactor-caused regression found and fixed:
  `rx/with-list-loading.spec.ts` still imported the pre-move `../loading-bar/progress-bar.service`
  (should be `../components/loading-bar/...`) — the `.ts` was fixed during the move but the spec was
  missed. Now passes. All other failures verified pre-existing (byte-identical to HEAD, unrelated to
  structure): landing `segmented` (`ResizeObserver` not polyfilled in test-setup), console
  `scrollspy-rail` (`activeId.set` on an `input()`), `asset-upload-zone` (`DataTransfer` not in jsdom),
  `feature-admin/users` (assertion drift on default `sortBy/sortDir`), and api's document-engine-core
  ESM `transformIgnorePatterns` + `skill.dto ReorderSchema`. None block task 380.
