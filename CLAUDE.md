# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nx monorepo for a professional portfolio website. Angular 21 SSR frontend, NestJS API backend, shared libraries (types, utils, ui, api-client).
**Philosophy:** Pragmatic Test-Driven Development

## Tech Stack

- **Angular:** 21.1.0 (Signals, SSR, standalone) | **NestJS:** 11.0.0 | **Nx:** 22.4.4
- **Package Manager:** pnpm | **Node:** 20+ LTS

## References

- **Architecture:** Backend (NestJS: Controllers → Services → Repositories), FE (Angular Signals/SSR). See `.context/patterns.md`
- **TDD:** Red → Green → Refactor. Delegate test execution to test-runner subagent. See `.context/testing-guide.md`
- **Nx:** Projects in `apps/*/project.json`, `libs/*/project.json`. Use `nx affected` for scoped runs.

## Context Files (`.context/`)

- `vision.md` - Project goals and philosophy
- `patterns.md` - Architecture and code patterns
- `angular-style-guide.md` - Angular v21+ syntax standards (signals, control flow, queries)
- `testing-guide.md` - TDD workflow and patterns
- `commands.md` - All dev/build/test commands
- `decisions.md` - Architecture decision records
- `progress.md` - Task completion tracking
- `tasks/*.md` - Individual task definitions
- `plans/*.md` - Epic and feature plans

## Formatting Rules

- Run `npx prettier --write <file>` on each modified file before committing (applies exclusively to .ts, .html, and .scss files). Never run `pnpm format` globally.
- Multi-line HTML: opening and closing tags on their own lines when content doesn't fit on one line.

## UI Development

- Use `.scss` files only (never `.css`). Prefer Tailwind utility classes; custom SCSS only when necessary.
- Use `playwright-skill` for UI validation. Test shared components/logic on `/ddl` route first.

### Component Domain Separation

**CRITICAL: Components are strictly separated by application domain:**

| Component Type | Selector Prefix | Location | Usage |
|----------------|-----------------|----------|-------|
| **Landing Page Components** | `landing-*` | `libs/landing/shared/ui/` | Custom UI components for the landing page (button, card, input, badge, link, icon, etc.) |
| **Dashboard Components** | `mat-*` | Angular Material | Material Design components for dashboard/admin interface |

**Rules:**
- Landing page MUST use `landing-*` components exclusively
- Dashboard app MUST use `mat-*` (Angular Material) components exclusively
- NEVER mix component domains (no Material in landing, no landing-* in dashboard)
- When creating new UI components, determine the target application first

## Critical Guardrails

| Rule                  | Action                                                                | Example                                                            |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Verify Nx names**   | Run `pnpm nx show projects \| grep -i "<term>"` before nx commands    | `libs/landing/shared/ui` → project is `ui` not `landing-shared-ui` |
| **Read don't assume** | Read actual files (project.json, index.ts) instead of guessing        | Check exports before adding, verify project.json for config        |
| **Forward slashes**   | Use `/tmp/file.js` in cross-platform tools (Playwright, Node scripts) | ✅ `/tmp/` ❌ `C:\tmp\`                                            |

## Angular Code Style

**All code must follow Angular v21+ modern syntax.** See `.context/angular-style-guide.md` for complete standards:
