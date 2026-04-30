# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo for a professional portfolio website. Angular 21 SSR frontend, NestJS API backend, shared libraries (types, utils, ui, api-client).
**Philosophy:** Pragmatic Test-Driven Development

## Tech Stack

- **Angular:** 21.1.0 (Signals, SSR, standalone) | **NestJS:** 11.0.0 | **Nx:** 22.4.4
- **Package Manager:** pnpm | **Node:** 20+ LTS
- **Zod:** v4 — Use latest Zod v4 syntax (e.g., `z.email()` not `z.string().email()`)

## References

- **Architecture:** Backend (NestJS: Controllers → Services → Repositories), FE (Angular Signals/SSR). See `.context/patterns-architecture.md`
- **Design System:** Tokens, components, layout patterns. See `.context/design/` (foundations, landing, console, shared)
- **Console Cookbook:** Actionable spacing/typography rules for console pages — read this before writing any console HTML/SCSS. See `.context/design/console-cookbook.md`
- **Design Bank:** Research-backed UX principles and patterns. See `.context/design/bank/index.md`
- **TDD:** Red → Green → Refactor. Delegate test execution to test-runner subagent. See `.context/testing-guide.md`
- **Nx:** Projects in `apps/*/project.json`, `libs/*/project.json`. Use `nx affected` for scoped runs.

## Skills

Use these skills for specific workflows. More will be added over time.

| Skill            | When to Use                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| `prisma-migrate` | Any Prisma schema change or migration (creates, applies, handles backups)  |
| `aqa-expert`     | Writing or updating E2E tests (Playwright, POM pattern, flakiness checks)  |
| `design-ingest`  | Extracting design knowledge from articles/URLs into the bank               |
| `design-check`   | Reviewing a component against design bank patterns                         |
| `ng-lib`         | Creating new Nx Angular libraries (correct tags, directory, import paths)  |
| `component-bank` | Creating or updating per-component design docs in `.context/design/components/` |

## Context Files (`.context/`)

- `vision.md` - Project goals and philosophy
- `patterns-architecture.md` - Architecture, module boundaries, code patterns
- `patterns-error-handling.md` - **Read before adding error codes or wiring submit forms.** BE throw → FE toast/inline-error flow, dictionary, ServerErrorDirective procedure
- `design/` - Design system (foundations, landing, console, shared)
- `design/console-cookbook.md` - **Read before writing console HTML/SCSS.** Spacing decision table, typography class picker, surface/text pairings, pre-report checklist
- `design/components/` - **Read before editing any documented component.** Per-component design bank (behavior contract, implementation rules, quality checklist). Each family has an `_overview.md` of family-wide rules; do not repeat those in component docs.
- `design/visual-feedback.md` - Chrome DevTools MCP screenshot workflow for console pages (login snippet, when to screenshot, what to check)
- `DESIGN-landing.md` - Stitch-compatible AI-readable spec for landing
- `DESIGN-console.md` - Stitch-compatible AI-readable spec for console
- `angular-style-guide.md` - Angular v21+ syntax standards (signals, control flow, queries)
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
| **Never read .env files**  |                                                                       |                                                                    |
| **No errors in controllers** | Controllers never throw errors — all error logic in command/query handlers | `if (!user) throw NotFoundError(...)` belongs in handler, not controller |
| **4px grid**                 | All fixed px values must be multiples of 4. Even non-multiples (6, 10, 18) sparingly. Odd px banned. | ❌ `text-[13px]` ✅ `text-xs`; see `.context/design/scale-contract.md` |
| **Typography classes**       | Use unified `.text-page-title`, `.text-section-heading`, `.text-stat-label`, etc. | See `base/components.scss` |
| **Target test files**        | Run single-file tests with `npx jest --config apps/api/jest.config.cts <file> --no-coverage`. Never use `nx test api` for single files — it compiles the entire project. | ❌ `nx test api --testPathPattern=foo` ✅ `npx jest --config ... foo.spec.ts` |
| **Angular style guide**     | Read `.context/angular-style-guide.md` before writing any Angular template or component logic | Every change touching `.ts`/`.html` in `libs/` or `apps/console/` |
| **Component bank**          | Before editing a component listed in `.context/design/components/`, read its md and the family `_overview.md`. After a design discussion that yields a rule, suggest persisting via `/component-bank`. | Editing `chip-*`, future documented components |
| **Guidance docs are timeless** | Reference docs in `.context/design/`, `.context/patterns-*`, `*-guide.md`, `vision.md`, `domain.md` describe the system as it is — no migration trackers, dated changelogs, or per-epic status. Status goes in the originating epic file or `progress.md`; one-shot decisions go in `decisions.md`. Sweep epic additions for ephemeral wording before closing. | ❌ "Migration status (applied YYYY-MM-DD)" inside cookbook ✅ same content in epic file |

## Angular Code Style

**All code must follow Angular v21+ modern syntax.** See `.context/angular-style-guide.md` for complete standards (signals, control flow, forms, guardrails).
