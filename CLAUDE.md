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
- `testing-guide.md` - TDD workflow and patterns
- `commands.md` - All dev/build/test commands
- `decisions.md` - Architecture decision records
- `progress.md` - Task completion tracking
- `tasks/*.md` - Individual task definitions
- `plans/*.md` - Epic and feature plans

## Formatting Rules

- Run `npx prettier --write <file>` on each modified file before committing. Never run `pnpm format` globally.
- Multi-line HTML: opening and closing tags on their own lines when content doesn't fit on one line.

## UI Development

- Use `.scss` files only (never `.css`). Prefer Tailwind utility classes; custom SCSS only when necessary.
- Use `playwright-skill` for UI validation. Test shared components/logic on `/ddl` route first.
