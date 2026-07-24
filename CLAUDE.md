# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo for a professional portfolio website. Angular 21 SSR frontend, NestJS API backend, shared libraries (types, utils, ui, api-client).
**Philosophy:** Pragmatic Test-Driven Development

## Tech Stack

- **Angular:** 21.1.0 (Signals, SSR, standalone) | **NestJS:** 11.0.0 | **Nx:** 22.4.4
- **Package Manager:** pnpm | **Node:** 20+ LTS
- **Zod:** v4 — Use latest Zod v4 syntax (e.g., `z.email()` not `z.string().email()`)

## Quick Start

```bash
pnpm dev:landing          # Angular landing + SSR (port 4200)
pnpm dev:api              # NestJS API (port 3000)
pnpm dev:console          # Console app (port 4300)
npx tsc --noEmit          # Type-check after edits
```

Full command list in `.context/commands.md`.

## References

- **Architecture:** Backend (NestJS: Controllers → Services → Repositories), FE (Angular Signals/SSR). See `.context/patterns-architecture.md`
- **Design System:** Tokens, components, layout patterns. Start at `.context/design/index.md` (bucket map); system tokens in `design/system/` (foundations, landing, console, shared)
- **Console Cookbook:** Actionable spacing/typography rules for console pages — read this before writing any console HTML/SCSS. See `.context/design/cookbook/console.md` (+ `cookbook/forms.md`)
- **Design skill + library:** Universal `/design` skill (research / ingest / review / revamp / document) carrying the reusable principles / patterns / taste library at `~/.claude/skills/design/shared/`. The project bank links it by concept
- **TDD:** Red → Green → Refactor. Delegate test execution to test-runner subagent. See `.context/testing-guide.md`
- **Nx:** Projects in `apps/*/project.json`, `libs/*/project.json`. Use `nx affected` for scoped runs.

## Skills

Use these skills for specific workflows. More will be added over time.

| Skill            | When to Use                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| `prisma-migrate` | Any Prisma schema change or migration (creates, applies, handles backups)  |
| `aqa-expert`     | Writing or updating E2E tests (Playwright, POM pattern, flakiness checks)  |
| `design`         | All design / UI-UX work — research, ingest, review, revamp, document (`/design [mode]`). Owns what design-ingest / design-check / component-bank / ui-research used to do |
| `ng-lib`         | Creating new Nx Angular libraries (correct tags, directory, import paths)  |

## Context Files (`.context/`)

- `vision.md` - Project goals and philosophy
- `patterns-architecture.md` - Architecture, module boundaries, code patterns
- `patterns-file-structure.md` - **Read before naming or moving any FE file/folder, or creating a component/service/lib.** Filename grammar (`<entity>.[variant].<role|kind>.[spec].<ext>`, dot=structural / dash=word-joiner), role vocabulary, folder-per-component rule, file↔class↔selector mapping, lint/generator enforcement
- `patterns-lib-structure.md` - **Read before touching any `shared/ui` library layout.** Bucket taxonomy (`components/ directives/ pipes/ services/ styles/`), primary-artifact placement rule, compound-component rule, single public-API barrel, style organization (`styles/_index.scss` + includePaths), one shared-ui lib per scope
- `patterns-error-handling.md` - **Read before adding error codes or wiring submit forms.** BE throw → FE toast/inline-error flow, dictionary, ServerErrorDirective procedure
- `patterns-hotkeys.md` - **Read before registering, changing, or removing any keyboard shortcut.** System-wide hotkey inventory (global / console / landing / editor-owned), the three registration models, the `isEditableTarget` typing guard, and the rules for adding new shortcuts
- `design/index.md` - **Start here for the design bank.** Living bucket map: `system/ contracts/ cookbook/ patterns/ components/ workflow/ ingest/`. Universal principles/patterns/taste live in the `/design` skill and are linked by concept.
- `design/cookbook/console.md` + `design/cookbook/forms.md` - **Read before writing console HTML/SCSS.** Spacing/typography/layout decision tables; form input-type + validator picker and the new-form checklist.
- `design/components/` - **Read before editing any documented component.** Per-component thin decision records (behavior contract, anti-patterns) + living `_index.md`. Each family has an `_overview.md` of family-wide rules; do not repeat those in component docs.
- `design/workflow/visual-feedback.md` - Chrome DevTools MCP screenshot workflow for console pages (login snippet, when to screenshot, what to check)
- `DESIGN-landing.md` - Stitch-compatible AI-readable spec for landing
- `DESIGN-console.md` - Stitch-compatible AI-readable spec for console
- `angular-style-guide.md` - Angular v21+ syntax standards (signals, control flow, queries)
- `design/contracts/responsive-contract.md` - **Read before writing any responsive CSS or breakpoint logic.** The locked 4-BP system (mobile/tablet/laptop/wide), hybrid direction, SCSS mixins, `currentBp()` observer, image primitive, lint guard. Landing-scoped; console deferred.
- `landing-ssr.md` - **Read before touching landing data services, fonts, or nav links.** SSR hydration rules: HTTP transfer cache, FOUT preload recipe, `HydrationSafeActiveDirective` usage
- `guides/deploy-railway-ssr.md` - **Read before deploying any new Angular SSR app.** Reusable runbook: Railway service config, Cloudflare DNS/SSL/cache rules, SSR fetch-rewrite patch, common failures
- `testing-guide.md` - TDD workflow and patterns
- `commands.md` - All dev/build/test commands
- `getting-started.md` - Prerequisites, setup, and common tasks
- `decisions.md` - Architecture decision records
- `progress.md` - Task completion tracking
- `tasks/*.md` - Individual task definitions
- `plans/*.md` - Epic and feature plans

## Formatting Rules

- Pre-commit hook (`husky` + `lint-staged`) auto-formats staged `.ts`, `.html`, `.scss` files with Prettier.
- You can still run `npx prettier --write <file>` manually on individual files.
- There is no global `pnpm format` script — formatting is per-file only.
- Multi-line HTML: opening and closing tags on their own lines when content doesn't fit on one line.

## UI Development

- Use `.scss` files only (never `.css`). Prefer Tailwind utility classes; custom SCSS only when necessary.
- Use `playwright-skill` for UI validation. Test shared components/logic on `/ddl` route first.
- **Never start the `landing` or `console` dev server yourself** (`pnpm dev:landing`, `pnpm dev:console`, or any `nx serve`). The user runs these. If a task needs a running server and none is up, **say so and ask the user to start it** — do not start or restart it. You MAY run `nx build` for type-checking/bundling, and you MAY use a server the user already has running. If a skill/you started a server for a one-off test, kill it when the test is done. New routes/lazy chunks require a fresh server start (HMR won't register them reliably) — flag that and let the user restart.

### Component Domain Separation

**CRITICAL: Components are separated by application domain:**

| Component Type              | Selector Prefix | Location                  | Usage                                                                                    |
| --------------------------- | --------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| **Landing Page Components** | `landing-*`     | `libs/landing/shared/ui/` | Custom UI components for the landing page (button, card, input, badge, link, icon, etc.) |
| **Dashboard/Internal Apps** | —               | Angular Material + custom | Material components are preferred, but custom `ui-*` shared components are also used     |
| **Shared UI Components**    | `ui-*`          | `libs/shared/ui/`         | Cross-app reusable components (sidebar, shared icons, etc.)                              |

**Rules:**

- Landing page MUST use `landing-*` components exclusively (custom, visually distinctive)
- Dashboard/internal apps prioritize Angular Material but may also use `ui-*` shared components
- NEVER use `landing-*` components in dashboard, or Material in landing
- Shared `ui-*` components are available to any non-landing app
- When creating new UI components, determine the target application first

## Critical Guardrails

| Rule                       | Action                                                                | Example                                                            |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Verify Nx names**        | Run `pnpm nx show projects \| grep -i "<term>"` before nx commands    | `libs/landing/shared/ui` → project is `ui` not `landing-shared-ui` |
| **Read don't assume**      | Read actual files (project.json, index.ts) instead of guessing        | Check exports before adding, verify project.json for config        |
| **Forward slashes**        | Use `/tmp/file.js` in cross-platform tools (Playwright, Node scripts) | ✅ `/tmp/` ❌ `C:\tmp\`                                            |
| **Type check after edits** | If a `watch-servers` Monitor is active, skip manual `tsc` — the build output is the type check. Otherwise run `npx tsc --noEmit` after modifying `.ts` or `.html` files. | Also enforced in CI pipeline |
| **Never read .env files**  | Do not Read, Grep, or cat any `.env*` file — they hold secrets        | Ask the user for any value you need from `.env` instead of opening it |
| **No errors in controllers** | Controllers never throw errors — all error logic in command/query handlers | `if (!user) throw NotFoundError(...)` belongs in handler, not controller |
| **RTE field = 4 columns** | Every rich-text field MUST have `<field>Json` + `<field>Canonical` + `<field>Html` + `<field>SchemaVersion`, and the entity MUST persist `rich.canonical`. Enforced by `rte-canonical-contract.spec.ts`. See ADR-023 / patterns-architecture "Rich-Text Field Storage Contract". | Adding an RTE field → add all 4 cols + backfill entry, never Json/Html-only |
| **4px grid**                 | All fixed px values must be multiples of 4. Even non-multiples (6, 10, 18) sparingly. Odd px banned. | ❌ `text-[13px]` ✅ `text-xs`; see `.context/design/contracts/scale-contract.md` |
| **Typography classes (console)** | Use unified `.text-page-title`, `.text-section-heading`, `.text-stat-label`, etc. **Console only** — landing has its own scale (next row). | See `base/components.scss` |
| **Typography = tokens, never literals** | `font-size` → `var(--text-*)`/role class, `line-height` → `var(--leading-*)`, `letter-spacing` → `var(--tracking-*)`, `font-family` → `var(--font-*)`. Literals silently opt out of the global `--type-scale` knob and drift. Exceptions: icon-size (`.icon-*`), `em` font-size (contextual), RTE prose, `feature-ddl/`. Enforced by `scale-audit.js`. See `contracts/scale-contract.md` → Typography Token Rule. | ❌ `font-size: 0.875rem` ✅ `font-size: var(--text-sm)` |
| **Landing typography scale** | Landing uses ONLY `text-display-{xl,lg,md,sm}`, `text-body-{xl,lg,md,sm}`, `text-mono-{md,sm}` and the matching `--landing-*` CSS vars. Never use the shared scale (`text-{2xs..5xl}`, `--text-*`) or console role classes (`.text-page-title` etc.) inside `apps/landing/` or `libs/landing/`. Bare `<h1>..<h6>`, `<p>`, `<code>` inherit landing-bound defaults from `libs/landing/shared/ui/src/styles/_base-typography.scss`. | ❌ `text-xl` in landing ✅ `text-display-sm`; ❌ `var(--text-base)` ✅ `var(--landing-body-md)` |
| **DDL = source of truth for landing UI** | `/ddl` page is the canonical spec for landing typography, spacing, color, primitives, layouts. When the user agrees to ANY UI change (heading scale, prose rhythm, new primitive, layout pattern), update DDL (chart, pairing rule, or a `/ddl/<topic>` showcase page) IN THE SAME COMMIT as the code change. Reference DDL before designing new components — don't reinvent. | Switching prose headings to Inter → update display-scale chart + pairing rule #1 in `ddl.component.html`; new primitive → add `/ddl/<primitive>` showcase + DDL index entry |
| **Target test files**        | Run single-file tests with `npx jest --config apps/api/jest.config.cts <file> --no-coverage`. Never use `nx test api` for single files — it compiles the entire project. | ❌ `nx test api --testPathPattern=foo` ✅ `npx jest --config ... foo.spec.ts` |
| **Angular style guide**     | Read `.context/angular-style-guide.md` before writing any Angular template or component logic | Every change touching `.ts`/`.html` in `libs/` or `apps/console/` |
| **FE file naming & location** | Read `.context/patterns-file-structure.md` before naming/moving any FE file or creating a component/service/lib. Grammar `<entity>.[variant].<role\|kind>.[spec].<ext>` (dot=structural boundary, dash=word-joiner); drop `.component`, keep high-info kinds (`.service/.types/.routes/…`); role/variant from the controlled vocab; one folder per component (name===base), single-file artifacts flat, no `components/` bucket; WHERE comes from path+import-path+selector, never the filename. | ❌ `project/form.component.ts` ✅ `project.form/project.form.ts`; ❌ `popup.ts` ✅ `project.delete-dialog.ts` |
| **Detail pages = record view** | Console read views use the `console-record-*` family (`console-record-layout` + section/field/item/fold + property rail). Pick the component by data shape: scalar → `console-property` in the rail, long-form → `console-record-field` in the column. Never `.detail-field`. Read ADR-026 + `.context/design/patterns/record-detail-layout.md` before touching any `*.detail` page. | ❌ `<span class="detail-field__label">Description</span>` ✅ `<console-record-field label="Description">` |
| **Component docs**          | Before editing a component listed in `.context/design/components/`, read its md and the family `_overview.md`. After a design discussion that yields a rule, suggest persisting via `/design document`. | Editing `chip-*`, future documented components |
| **Design authority (ambient)** | Any UI/UX work follows the global `taste/` (`~/.claude/skills/design/shared/taste/`) + project `contracts/` (`.context/design/contracts/`) — read them **before** writing markup/SCSS, even without an explicit `/design` trigger. A new shareable component earns a design record: push the portable kernel to global via `/design document`, keep a thin project residue linking it. This is a **nudge**, not a hard gate (a PreToolUse hook is a future plugin-phase upgrade). | Building any component/page → check `taste/` + `contracts/` first; new shared primitive → `/design document` |
| **Hotkeys: guard + document** | Read `.context/patterns-hotkeys.md` before touching any keyboard shortcut. Global `document`/`window` shortcuts MUST guard with `isEditableTarget(e.target)` from `@portfolio/shared/ui` (skip while typing; `Escape`-to-close is the exception), never overload editor chords (`Mod+B/I/U/Z`) without a focus guard, `preventDefault` only past the guard, and add the new binding to the doc's inventory in the same change. | ❌ raw `document` keydown toggling on `Mod+B` with no guard ✅ `filter((e) => !isEditableTarget(e.target))` |
| **Reuse shared UI first**   | Before writing inline markup, grep shared libs (`libs/landing/shared/ui`, `libs/shared/ui`, `libs/console/shared/ui`) for an existing component. Reuse → extend (additive, no breaking change) → create-shared (when need will recur). Inline one-offs only when truly local AND single-use. | ❌ inline `<span>` for eyebrow ✅ `<landing-eyebrow>`; ❌ hardcoded `<h2>` ✅ `<landing-heading>` |
| **Guidance docs are timeless** | Reference docs in `.context/design/`, `.context/patterns-*`, `*-guide.md`, `vision.md`, `domain.md` describe the system as it is — no migration trackers, dated changelogs, or per-epic status. Status goes in the originating epic file or `progress.md`; one-shot decisions go in `decisions.md`. Sweep epic additions for ephemeral wording before closing. | ❌ "Migration status (applied YYYY-MM-DD)" inside cookbook ✅ same content in epic file |
| **Responsive: mixins, never raw @media** | Use the SCSS mixins (`respond-to`/`respond-down`/`respond-between` from `@use 'base/breakpoints'`) and the 4 device-bound names (`mobile/tablet/laptop/wide`). Never write raw `@media (min/max-width: …)`, raw `100vh` (use `var(--vh-full)`), or raw `@media (prefers-*)` (use `reduce-motion`/`color-scheme` mixins). For JS-driven layout swaps read `BreakpointObserverService.currentBp()`/`isAtLeast(bp)`. Banned: `sm/md/lg/xl/2xl`. Stylelint flags violations (warning). See `.context/design/contracts/responsive-contract.md`. | ❌ `@media (min-width: 768px)` ✅ `@include respond-to('tablet')` |
| **Agent spawn = ask only for multi-spawn** | Spawning a **single** agent (Agent/Task tool, incl. `fork`) needs no approval, whatever its model — e.g. the `/cap` review agent may run Opus and is fine to spawn directly. Only ask the user first when spawning **more than one** agent in a batch or in parallel (cost gate). | ✅ spawn one Opus review agent directly; ❌ launch 3 parallel agents without asking first |

## Angular Code Style

**All code must follow Angular v21+ modern syntax.** See `.context/angular-style-guide.md` for complete standards (signals, control flow, forms, guardrails).
