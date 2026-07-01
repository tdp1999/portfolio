# Shared-UI Library Structure (Bucket Taxonomy & Style Organization)

> The **macro** convention for how a `shared/ui` library is laid out internally: the bucket
> taxonomy, the public-API barrel, and where styles/tokens live. This is the counterpart to
> `patterns-file-structure.md` (the **micro** convention — filenames, role vocabulary,
> folder-per-component *within* a feature). For Nx lib types, scope/type tags and module
> boundaries see `patterns-architecture.md`.
>
> **Scope:** the three `type:shared-ui` libraries — `libs/landing/shared/ui` (`ui`),
> `libs/console/shared/ui` (`console-shared-ui`), `libs/shared/ui` (`shared-ui`). Feature libs and
> app code follow `patterns-file-structure.md`, **not** this doc.

---

## 1. Why buckets (and when they apply)

Pure-Angular component libs (Angular Material, MUI) are flat folder-per-component at `src/` root.
The **`components/` + sibling-kind buckets** layout (the Carbon/Chakra/Spectrum/React-DS family) is
chosen here because our shared-ui libs are **multi-concern** — they hold not just components but
directives, pipes, non-data services, design tokens, SCSS, theme and motion. When a lib carries
many *kinds* of artifact, grouping the components under `components/` and giving each other kind its
own sibling bucket keeps the root legible. (A components-only lib would more idiomatically be
flat-at-root — but none of ours is.)

This is a **library-level** decision and deliberately differs from feature/app code, which groups
by feature/concept per `patterns-file-structure.md §7`.

---

## 2. The canonical taxonomy

```
libs/<scope>/shared/ui/src/
├── index.ts              ← THE single public-API barrel (Nx boundary)
├── components/           ← every component, flat folder-per-component (name === folder)
│   └── button/  button.ts  button.html  button.scss  button.spec.ts  index.ts
├── directives/           ← attribute/structural directives (folder each)
├── pipes/                ← pure pipes
├── services/             ← non-data services (theme, toast, locale, keyboard…)
├── styles/               ← SCSS root
│   ├── _index.scss       ← @forward public Sass API / barrel
│   ├── tokens/  base/  themes/  (material/, motion/ where applicable)
└── test-setup.ts
```

- **No `lib/` tier.** Buckets sit directly under `src/` (Nx generators default to `src/lib/` —
  override / flatten it).
- **No sub-categories inside `components/`** — with one sanctioned exception (§6, `components/blocks/`).
  Otherwise flat folder-per-component; do **not** create `components/forms/`, `components/overlays/`.
  (Material/MUI don't sub-categorize; sub-folders reignite the "which group does this go in?" churn.)
- DI tokens (`InjectionToken`) **co-locate** with their component (Material-style); there is no
  separate TS `tokens/` bucket. SCSS design tokens live under `styles/tokens/` (or a top-level
  `tokens/` — see §6).

---

## 3. The two placement rules

**Rule A — a folder goes to the bucket of its *primary* artifact; co-located helpers ride along.**
A folder that contains a `@Component` (even with a sibling service/directive/types) → `components/`.
A folder whose sole/primary artifact is a service → `services/`; a pipe → `pipes/`; a directive →
`directives/`. (Examples: console `spinner/` and `loading-bar/` keep their `*.service.ts`
co-located inside `components/`; `toast/` — service-only, its component lives in a separate
`toast-container/` folder — goes to `services/`.)

**Rule B — cross-kind subsystems are dispersed strictly by kind; there are no "subsystem buckets."**
A feature area that spans multiple kinds (e.g. landing's old `shell/`, `motion/`, `keyboard/`) is
split: its components → `components/` (each its own folder), its directives → `directives/`, its
service → `services/`, its SCSS → `styles/`. There is **no** top-level `shell/` or `motion/`
*code* bucket. (This keeps every lib's bucket set uniform.)

**Compound components are one folder.** A tightly-coupled component family with many parts
(e.g. `shared-ui`'s sidebar: provider + layout parts + menu directives + module + state service)
stays as a **single** `components/<family>/` folder — it is one component, not a subsystem.

---

## 4. The public-API barrel

- **One root `index.ts`** is the lib's entire public surface and the `@nx/enforce-module-boundaries`
  boundary. Everything else is private.
- **Each component keeps its own sub-barrel `index.ts`**, re-exported by the root (Material's
  two-level barrel). This keeps the root a thin aggregator and avoids cross-component deep imports
  (cycle safety).
- The lib stays **non-buildable** with **no secondary entry points** — it's internal/unpublished, so
  the consuming app's bundler (esbuild) tree-shakes a single barrel of standalone, side-effect-free
  components fine. (Secondary entry points are a publishing concern via ng-packagr; buildable libs
  can't even have them.) Keep components `standalone` and the lib `sideEffects: false`.
- **Consumers import only via the path alias** (`@portfolio/<scope>/shared/ui`); internal file moves
  never reach them as long as the root barrel re-exports the same symbols.

---

## 5. Style organization

- **Component `.scss` co-locates** in the component folder (`styleUrl: './x.scss'`).
- **Shared SCSS lives in `styles/`** with a single `_index.scss` barrel (`@forward`). Effect/motion
  global styles, base element styles, themes, and Material overrides all live here, grouped:
  `styles/{tokens, base, themes, material, motion}/`.
- **The app's global stylesheet imports the scope barrel via one `@use`**, not à-la-carte deep
  imports. (e.g. `apps/console/src/styles.scss` → `@use '…/console/shared/ui/src/styles' as
  console-ui;` which forwards Material overrides + the RTE vendor stylesheet in cascade order.)
- **Global foundation tokens** (the cross-app `--color-*`, type scale, breakpoints, etc.) live in
  the consolidated `libs/shared/ui/src/styles/` and are consumed by both apps via
  `stylePreprocessorOptions.includePaths: ["libs/shared/ui/src/styles"]` → `@use 'tokens/colors'`,
  `@use 'base/…'`, etc.

---

## 6. Documented exceptions

These are the *only* sanctioned deviations from §2; new ones require updating this doc.

- **`rx/` bucket (console).** `withListLoading` is an RxJS operator that depends on a ui-lib service
  (`ProgressBarService`), so it cannot move to `shared-util` (`type:shared-util` may not depend on
  `type:shared-ui`). It is neither component/directive/pipe/service, so it lives in a small `rx/`
  bucket (reactive helpers) inside the ui lib — mirroring the existing `lib/rx/` grouping in
  `console-shared-util`.
- **Landing token filename `palette.scss` (not `colors.scss`).** Landing's local design tokens live
  under `styles/tokens/` like the global foundation, **but** the local palette file is named
  `palette.scss` instead of `colors.scss`. Reason: the global foundation is consumed via includePaths
  as bare `tokens/colors`, and Dart Sass resolves *relative before load-paths* — a local
  `styles/tokens/colors.scss` would shadow the global one and drop the `--color-*` base. Renaming it
  frees `tokens/colors` to resolve to the global file while landing's own palette loads via the local
  `styles/tokens/index.scss`. (Local `typography.scss`/`motion.scss` don't clash — landing never
  references the global `tokens/typography`.)
- **`components/blocks/` sub-group (landing `ui`).** The prose-block renderers of the `redoc-blocks`
  epic (`image-ref-block/`, `gallery-block/`, …) are grouped under `components/blocks/` rather than sitting
  flat among the primitives. They are a distinct **kind** — thin wrappers that map a canonical AST node
  onto a landing primitive and are registered via `provideBlockRenderers(...)` — so co-locating them keeps
  the block set legible as it grows and separates "renderer glue" from plain presentational primitives.
  Each block is still one folder-per-component (name === base) *inside* `blocks/`; the sub-group is the only
  permitted nesting level (no deeper categories). This is the sole exception to §2's flat-`components/` rule.
- **`services/` in a `type:ui` lib.** Nx defines `type:ui` as injecting no services. Our shared-ui
  libs already ship non-data services (theme, toast, breakpoint, locale…); we keep that reality and
  bucket them under `services/` rather than forcing them into `data-access`. Conscious deviation —
  see ADR-021.

---

## 7. Project granularity

**One `shared-ui` library per scope.** The global foundation is a single `libs/shared/ui`
(`shared-ui`) holding `components/` (the sidebar compound), `pipes/`, and the global `styles/`
foundation — it is **not** split into separate per-concern projects. (Historically `libs/shared/ui`
was three projects — `ui-pipes`, `sidebar`, `shared-ui-styles`; they were consolidated in task 380.)
This mirrors landing (`ui`) and console (`console-shared-ui`): every scope has exactly one shared-ui
lib with the same bucket structure.

---

## 8. Enforcement

The `fe-naming` ESLint plugin (`patterns-file-structure.md §11`) is currently scoped to
`apps/{landing,console}` + `libs/{landing,console}` and **excludes shared libs**, so the bucket
taxonomy here is **convention-enforced** (this doc + review), not lint-enforced. Selector-prefix
(`@angular-eslint/component-selector`/`directive-selector`) is per-project — shared-ui components use
the **`ui-`** prefix (kebab) / **`ui`** (camelCase directive). Adding lint coverage for the bucket
structure is a tracked follow-up.

---

## 9. Quick reference

```
BUCKETS  components/  directives/  pipes/  services/  styles/   (+ rx/ console, tokens/ landing)
RULE A   folder → bucket of its PRIMARY artifact; co-located helpers ride along
RULE B   cross-kind subsystem → split strictly by kind (no shell/ motion/ code buckets)
COMPOUND tightly-coupled family (sidebar) = ONE components/<family>/ folder
BARREL   one root index.ts (public API) + per-component sub-barrel; non-buildable; sideEffects:false
STYLES   component .scss co-located · shared SCSS in styles/_index.scss · app @use's the barrel once
GLOBAL   foundation in libs/shared/ui/src/styles, via includePaths
PREFIX   ui-  (component, kebab)   ui  (directive, camelCase)
```
