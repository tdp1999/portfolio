# File & Folder Structure Patterns

> The micro-convention for naming and locating files **inside** a library: filename grammar, role
> vocabulary, folder rules, and the lint/generator enforcement that keeps it from drifting.
> For the macro picture (Nx lib types, scope/type tags, module boundaries) see
> `patterns-architecture.md`. For Angular template/signal syntax see `angular-style-guide.md`.
>
> **Scope:** Frontend-first (`apps/landing`, `apps/console`, `libs/landing/**`, `libs/console/**`,
> `libs/shared/**`). The NestJS API already follows DDD/hexagonal naming and is documented as-is in
> §9 — do not restructure it.

---

## 1. Philosophy — a file's identity has three layers

The chaos a long filename tries to solve is really three **separate** questions. Do not cram them
into the filename. Distribute them:

```
identity = WHERE (which app / screen)  +  WHAT-KIND (role)  +  WHAT (concept)
```

| Question | Layer | Mechanism — NOT the filename's job |
| --- | --- | --- |
| Which app? (`api` / `console` / `landing`) | WHERE | Nx **scope folder** + **import path** (`@portfolio/console/…`) + **selector prefix** (`console-`) |
| Which screen? | WHERE | the **feature lib** + the **role word** + `*.routes.ts` (source of truth for "is it routed") |
| Component / service / pipe? | WHAT-KIND | the **role/kind segment** of the filename (see §3) |
| The concept | WHAT | the **entity** segment |

**Corollary.** `form.ts` alone is unfindable; `console-blog-posts-list-page.component.ts` is noise.
The fix is neither: it is a short, **globally searchable, self-describing** base name —
`blog-post.form.ts` — where the disambiguator is a *meaningful* token (entity + role), not the
zero-information word `component`. Path, import-path, and selector carry app/screen context; the
filename carries the concept.

---

## 2. Macro recap (one screen up)

Logic lives in libs; apps are thin. Every lib is one of four types, grouped by scope folder and
tagged `scope:*` + `type:*`, with `@nx/enforce-module-boundaries` guarding direction:

| Lib type | Holds | May import | Must NOT import |
| --- | --- | --- | --- |
| `feature-*` | smart, routable, lazy-loaded | ui, data-access, util | other features (except a feature-shell) |
| `shared/ui` | dumb / presentational, reusable | util | data-access, features |
| `shared/data-access` | HTTP, store, guards, interceptors | util | ui, features |
| `shared/util` | pure functions, types, constants | — | everything else |

Full details and the dependency rules: `patterns-architecture.md`.

---

## 3. Filename grammar (the core rule)

```
<entity> . [<variant>] . <role|kind> . [spec] . <ext>
   │           │              │           │        └ ts | html | scss
   │           │              │           └ optional test marker
   │           │              └ ALWAYS the segment immediately before [spec.]ext
   │           └ optional qualifier; controlled vocabulary
   └ first segment; the domain noun
```

This is the **classic Angular grammar, generalized**: classic was `<name>.<type>.<spec?>.<ext>` with
`type ∈ {component, service, …}`. Here the zero-information `.component` is dropped and its slot is
filled by a **meaningful role**; an optional `variant` may sit between entity and role.

```
classic:   user-profile . component . spec . ts
ours:      project       . edit      . form . spec . ts
           └ entity        └ variant   └ role  └ test  └ ext
```

### Parsing (deterministic)

Split on `.`: **first** segment = entity · **last before `[spec.]`ext** = role/kind · **middle** =
variant. A multi-word entity stays one segment via `-`:

```
blog-post.edit.form.ts   →  entity=blog-post · variant=edit · role=form
```

### A word may be role in one position, variant in another

The "last-before-ext = role" rule is what disambiguates:

```
project.list.ts           →  role=list      (the screen)
project.list.skeleton.ts  →  variant=list · role=skeleton   ("skeleton for the project list")
project.list.empty.ts     →  variant=list · role=empty      ("empty state of the project list")
```

### Degenerate case — entity is the whole concept

Omit role/kind when the entity name alone is unambiguous (shared/ui primitives, landing page
containers):

```
button.ts   icon.ts   card.ts        (shared/ui primitives)
home.ts     about.ts                 (landing page containers)
```

---

## 4. Separator semantics

| Separator | Meaning | Example |
| --- | --- | --- |
| `.` (dot) | **structural boundary** between entity / variant / role / spec / ext (a "namespace") | `blog-post` **.** `form` **.** `ts` |
| `-` (hyphen) | **word-joiner inside a single segment** (a multi-word phrase) | `blog-post`, `delete-dialog`, `status-badge` |

This is why dot beats all-kebab when both entity and role are multi-word — the boundary stays
legible:

```
✅ blog-post.delete-dialog.ts      entity=blog-post · role=delete-dialog
❌ blog-post-delete-dialog.ts      four kebab tokens, boundary lost
```

> **Note — deliberate divergence.** The official Angular style guide uses all-kebab base names
> (`user-list.ts`). We adopt dot-separated structural segments instead for boundary clarity and
> uniformity with the kept kind-suffixes. Generators must be configured to emit this shape (§11).

---

## 5. Role & variant vocabulary (controlled, lint-enforced)

Roles and variants are a **closed set**. Adding a word = a PR that updates this section **and** the
lint allowlist (§11). This is what stops `popup` vs `modal` vs `dialog` drift.

### Console (CRUD / admin) — UI roles

| Group | Role words | Routable? | Example file |
| --- | --- | --- | --- |
| Screen | `list` · `detail` · `form` | ✅ | `project.list.ts`, `project.form.ts` |
| Overlay | `dialog` · `drawer` · `panel` · `sheet` · `menu` · `popover` | ✖ | `project.delete-dialog.ts` |
| Presentational | `card` · `row` · `item` · `cell` · `badge` · `chip` · `tag` · `header` · `toolbar` · `filter-bar` · `section` | ✖ | `project.card.ts` |
| State | `empty` · `skeleton` · `fallback` · `error` | ✖ | `project.list.skeleton.ts` |
| Layout | `layout` · `shell` | ✖ | `console.blank.layout.ts` |

### Landing (marketing) — section-named

Landing pages are bespoke compositions, not CRUD. The "role" slot is a **descriptive section name**
(open-ended, but still one segment): `home.hero.ts`, `home.intro.ts`, `home.selected-work.ts`,
`about.cta.ts`. Overlay/state words above still apply. Shared primitives live in
`libs/landing/shared/ui` and are self-named (`button.ts`, `card.ts`).

### Variant vocabulary

Optional qualifier for a true variant of the **same entity + role**:

`create` · `edit` · `public` · `admin` · `trash` · `mobile` · `desktop` · plus any screen name used
to scope a state component (e.g. `list` in `project.list.skeleton.ts`).

```
project.form.ts        project.edit.form.ts     project.create.form.ts
blog.detail.ts         blog.public.detail.ts
media.list.ts          media.trash.list.ts
```

### Kept kind-suffixes (non-component, high-information)

These are **not** dropped — they are rare, distinct, and searchable (typing "service" to find
services is useful; typing "component" is not):

| Kind | File | Lives |
| --- | --- | --- |
| Service | `*.service.ts` | data-access lib, or feature root if feature-local |
| Store / signal store | `*.store.ts` | data-access |
| Guard / resolver / interceptor | `*.guard.ts` · `*.resolver.ts` · `*.interceptor.ts` | data-access |
| Pipe | `*.pipe.ts` | ui or util |
| Directive | `*.directive.ts` | ui |
| Types / model | `*.types.ts` · `*.model.ts` | anywhere (flat at root) |
| Routes | `*.routes.ts` | feature root |
| Constants / config / tokens | `*.constants.ts` · `*.config.ts` · `*.tokens.ts` | anywhere (flat) |

---

## 6. Three representations — one deterministic mapping

The filename uses dots; HTML selectors cannot, so they map by rule. Lint checks all three agree:

| Representation | Separators | App prefix | Example |
| --- | --- | --- | --- |
| **File base** | `.` between segments, `-` within | ✖ | `blog-post.edit.form.ts` |
| **Class** | PascalCase, no separators | ✖ | `BlogPostEditForm` |
| **Selector** | all `-` | ✅ | `console-blog-post-edit-form` |

Rules: `selector = <app>-<entity-kebab>-[<variant>-]<role-kebab>` · `class = PascalCase` of the same
words · template/style filenames share the base (`blog-post.edit.form.html` / `.scss`).

---

## 7. Folder rules

- **One folder per component**, folder name **===** the component base name (dots and all):

  ```
  project.form/
    project.form.ts
    project.form.html
    project.form.scss
    project.form.spec.ts
  media.trash.list/
    media.trash.list.ts  …
  ```

- **Private children nest inside the parent's folder** (a piece used only by that component):

  ```
  project.form/
    project.form.ts
    project.form.tech-field.ts        (+ .html/.scss if needed)
  ```

- **Single-file artifacts stay flat** at the lib `src/` root — never a folder for one file:

  ```
  project.routes.ts   project.service.ts   project.types.ts   project.constants.ts
  ```

- **No generic type buckets.** `components/`, `services/`, `directives/` are banned — group by
  feature/concept, not by kind (per the Angular style guide).

---

## 8. Per-lib-type structure

### Feature lib (`libs/<scope>/feature-*`)

```
libs/console/feature-project/src/
├── project.list/          project.list.ts/.html/.scss/.spec.ts     ← screen (routed)
├── project.detail/        project.detail.ts …
├── project.form/          project.form.ts …
│   └── project.form.tech-field.ts                                  ← private child
├── project.card/          project.card.ts …                        ← presentational
├── project.delete-dialog/ project.delete-dialog.ts …               ← overlay
├── project.routes.ts      ← source of truth for which screens are routed   (flat)
├── project.service.ts     ← feature-local service (flat)
├── project.types.ts
└── project.constants.ts

libs/landing/feature-home/src/
├── home/                  home.ts …            ← container (entity only, no role)
├── home.hero/             home.hero.ts …
├── home.selected-work/    home.selected-work.ts …
└── home.routes.ts
```

`index.ts` (lib root) exports only the lib's **public** surface — usually the routed container(s)
and any types other libs consume. Everything else is private to the lib.

### shared/ui lib (`libs/<scope>/shared/ui`)

- Layout is **flat under `/src`** (no `/src/lib/` nesting) — standardized across landing and
  console. (Nx generators default to `/src/lib`; the generator config in §11 overrides this.)
- One folder per component; the component is self-named (no entity prefix — the component *is* the
  entity): `button/button.ts`, `card/card.ts`.
- Cross-cutting buckets allowed here only: `styles/`, `tokens/`, `motion/`, `theme/`, `shell/`.

```
libs/landing/shared/ui/src/
├── button/      button.ts  button.scss  button.spec.ts  index.ts
├── card/        card.ts    card.scss    index.ts
├── icon/        icon.ts    icon.types.ts  providers/…  index.ts
├── theme/       theme.service.ts  theme-toggle.ts  index.ts
├── tokens/      colors.scss  typography.scss  index.scss
├── styles/      _prose.scss  index.scss
└── index.ts     ← barrel re-exporting every component
```

### data-access lib (`libs/<scope>/shared/data-access`)

Flat, grouped by concept; kind-suffix carries the type:

```
src/lib/
├── project.service.ts   blog.service.ts
├── auth.store.ts
├── auth.guard.ts        unread-badge.service.ts
└── http.interceptor.ts
```

### util lib (`libs/<scope>/shared/util` or `libs/shared/utils/*`)

```
src/lib/
├── date.util.ts   slug.util.ts
├── enum-labels.constants.ts
└── api.types.ts
```

---

## 9. Backend (NestJS) — documented as-is, do not restructure

The API already follows DDD/hexagonal layering consistently. Each module under
`apps/api/src/modules/<entity>/`:

```
<entity>/
├── application/
│   ├── <entity>.dto.ts          <entity>.presenter.ts        <entity>.token.ts
│   ├── commands/   create-*.command.ts  update-*.command.ts  index.ts
│   ├── queries/    list-*.query.ts      get-*.query.ts        index.ts
│   └── ports/      <entity>.repository.port.ts
├── domain/
│   ├── <entity>.types.ts
│   └── entities/   <entity>.entity.ts
├── infrastructure/
│   ├── mapper/         <entity>.mapper.ts
│   └── repositories/   <entity>.repository.ts
├── presentation/   <entity>-admin.controller.ts  <entity>-public.controller.ts
├── <entity>.module.ts
└── index.ts
```

Here the kind-suffix is the role (`.command` / `.query` / `.entity` / `.repository` / `.mapper` /
`.presenter` / `.dto` / `.controller` / `.module`) and the layer folder carries WHERE. This is the
same three-layer identity philosophy (§1) applied to the backend — no change needed.

---

## 10. Checklist — "is this file placed & named right?"

```
[ ] In the correct lib TYPE? (no HTTP in ui, no UI in data-access, no feature→feature import)
[ ] WHERE comes from path + import-path + selector prefix — NOT stuffed into the filename
[ ] Grammar: <entity>.[variant].<role|kind>.[spec].<ext>, role/kind last before [spec.]ext
[ ] Dot between structural segments; hyphen only within a multi-word segment
[ ] role & variant are from the controlled vocabulary (§5)
[ ] .component dropped; high-info kind-suffix kept (service/types/routes/…)
[ ] Component → own folder named === base; single-file artifact → flat at root; no type bucket
[ ] file base, class (PascalCase), selector (<app>-…) all agree (§6)
[ ] exported via the lib's index.ts barrel; no deep cross-lib import
```

---

## 11. Enforcement — what makes it stick

Rules that are not automated rot. The standard is upheld by three mechanisms:

1. **ESLint — naming + boundaries.**
   - `@nx/enforce-module-boundaries` (scope/type tags) — already configured; keep it strict.
   - A filename-grammar rule (custom rule or `eslint-plugin-check-file`) asserting
     `<entity>.[variant].<role>.[spec].<ext>` and that `role`/`variant` ∈ the allowlist mirroring §5.
   - A rule asserting class + selector derive from the file base (§6).
2. **Generators emit it correctly.** Update the `ng-lib` / component skill (and the Nx/Angular
   schematics defaults in `nx.json`) so new components are born flat-in-`/src`, dot-named, no
   `.component` suffix. New files should never need manual renaming.
3. **One guardrail line in `CLAUDE.md`** pointing here, so every `.ts`/`.html` change is checked
   against this doc.

The controlled vocabulary in §5 is the single source of truth; the lint allowlist must be updated in
the same PR that adds a word here.

---

## 12. Quick reference

```
FILE     <entity>.[variant].<role|kind>.[spec].<ext>
         project.edit.form.spec.ts
SELECTOR <app>-<entity>-[variant]-<role>            console-project-edit-form
CLASS    PascalCase                                 ProjectEditForm

DOT  = structural boundary (entity / variant / role / spec / ext)
DASH = word-joiner inside one segment (blog-post, delete-dialog)

DROP  .component
KEEP  .service .store .guard .resolver .interceptor .pipe .directive
      .types .model .routes .constants .config .tokens

FOLDER  one per component, name === base (dots ok); private children nest;
        single-file artifacts flat at src root; no components/ bucket
WHERE   path + import-path + selector prefix — never the filename
```
