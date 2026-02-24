# Task: Scaffold console Angular application

## Status: done

## Goal
Generate the `apps/console/` Angular 21 application using Nx. CSR only (no SSR). Must run dry-run first and get user approval before actual generation.

## Context
First task of the Console epic. Creates the base app that all other tasks build upon. Console is a separate internal app (not nested in landing), served on its own subdomain.

## Acceptance Criteria
- [x] Run `nx g @nx/angular:application` with `--dry-run` flag and present output to user
- [x] Wait for user approval before executing actual generation
- [x] `apps/console/` created with standalone Angular 21 app (CSR, no SSR)
- [x] `project.json` has tags: `scope:console`, `type:app`
- [x] Selector prefix set to `console`
- [x] No SSR files (no `server.ts`, no `main.server.ts`)
- [x] App compiles and serves (`nx serve console`)
- [x] Dev script `pnpm dev:console` added to `package.json` (port 4300)
- [x] `tsconfig.base.json` — no path needed yet (paths are for libs, not the app itself)

## Technical Notes
- Use `@nx/angular:application` generator
- Flags: `--style=scss`, `--standalone`, `--prefix=console`, `--routing`, `--ssr=false`
- Configure serve target port to 4300 in `project.json`
- Verify no conflict with existing apps

## Files to Touch
- `apps/console/` (generated)
- `package.json` (dev script)
- `tsconfig.base.json` (paths)

## Dependencies
None — this is the foundation task.

## Complexity: M
