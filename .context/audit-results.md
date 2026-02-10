# Project Audit Results

> Audit date: 2026-02-10

---

## 1. Project Structure

**Rating: Solid** - Well-architected Nx monorepo with proper domain boundaries.

### Issues Found & Resolutions

| # | Issue | Severity | Resolution | Status |
|---|-------|----------|------------|--------|
| 1 | `nx.json` `defaultBase: "main"` but branch is `master` — breaks `nx affected` | Bug | Changed to `"defaultBase": "master"` | Fixed |
| 2 | `nx.json` component generator defaults to `css` instead of `scss` | Bug | Changed `@nx/angular:component` style to `scss` | Fixed |
| 3 | Inconsistent component file naming (`feature-home.ts` vs `button.component.ts`) | Low | Adopt newer convention (drop `.component` suffix) on next touch. No bulk rename. | Deferred |

### Non-Issues (Confirmed OK)

- Empty scaffold libraries (`data-access`, `util`) — negligible cost, correct paths established early
- Monolithic UI library at 8 components — split only when >20 components or test times suffer
- Angular Material installed without dashboard app — kept intentionally per project decision

---

## 2. Tech Stack

**Rating: Strong** - Modern choices across the board. A few debts to track.

### Issues Found & Resolutions

| # | Issue | Severity | Resolution | Status |
|---|-------|----------|------------|--------|
| 4 | Tailwind v3 (v3.4.0) — v4 not compatible with Angular 21 | N/A | Not actionable. v3 is the correct choice. | Non-issue |
| 5 | `@apply` in global SCSS (`typography.scss`) — anti-pattern | Medium | Replaced with plain CSS using design tokens (`var(--text-5xl)` etc.). `@apply` removed from all global styles. | Fixed |
| 6 | No runtime environment config for Angular app | Medium | Use `provideAppInitializer` to load config from JSON/endpoint at runtime. Avoids per-environment builds. | Deferred |
| 7 | `reflect-metadata@0.1.13` outdated | Low | Updated to `0.1.14` (max safe within NestJS 11 compat range). `0.2.x` has breaking changes. | Fixed |

### Non-Issues (Confirmed OK)

- Angular 21 + Signals + SSR + Standalone — latest stable, modern APIs throughout
- NestJS 11 + Webpack + SWC — correct monorepo setup, deployment-ready
- Design token architecture (primitive/semantic/component) — well designed
- Tailwind + SCSS hybrid approach — pragmatic, ADR trail is clear

## 3. Testing Strategy

**Rating: Good (B+)** - Strong component testing, but gaps in enforcement and dead dependencies.

### Issues Found & Resolutions

| # | Issue | Severity | Resolution | Status |
|---|-------|----------|------------|--------|
| 8 | `app.service.spec.ts` over-tests trivial code (5 tests for static return) | Low | Reduced to 1 meaningful test. Integration test already covers the endpoint. | Fixed |
| 9 | UI library has zero coverage thresholds despite being the most critical testable code | Medium | Added 80% threshold (branches, functions, lines, statements) to `jest.config.cts` | Fixed |
| 10 | `@testing-library/angular` + `@testing-library/dom` + `@testing-library/jest-dom` installed but unused | Low | Removed all three packages. Reinstall if/when adopting Testing Library approach. | Fixed |
| 11 | `api-e2e` project is effectively empty | Low | Populate with real tests when API has endpoints, or delete the project. | Deferred |

### Non-Issues (Confirmed OK)

- Zoneless Angular testing (`setupZonelessTestEnv`) — correct modern approach
- UI component tests (button, card, input, icon) — excellent quality, AAA pattern, real behavior testing
- XSS prevention tests in IconComponent — outstanding security awareness
- Test factories in `shared/testing` — proper factory pattern, self-tested
- Playwright setup — pragmatic (Chromium-only, auto dev server, CI retries)

## 4. Documentation

**Rating: Excellent (A-)** - Comprehensive .context/ system. Minor maintenance and scaling fixes applied.

### Issues Found & Resolutions

| # | Issue | Severity | Resolution | Status |
|---|-------|----------|------------|--------|
| 12 | `patterns.md` at 1,109 lines — too large for effective use | Medium | Split into `patterns-architecture.md` (code/testing/naming) and `patterns-design-system.md` (tokens/components/layout). Original file now a redirect. CLAUDE.md updated. | Fixed |
| 13 | `commands.md` stale — missing E2E, DDL, type-check, formatting commands | Medium | Rewrote with all current commands, added DDL route reference, formatting warning, type-check section. | Fixed |
| 14 | `vision.md` references Angular 20 | Low | No stale refs in vision.md. References in tasks-done/ and plans/ are historical records — correct as-is. | Non-issue |
| 15 | 43 completed tasks in flat `tasks-done/` — won't scale | Low | Reorganized into `tasks-done/epic-nx-monorepo-setup/`, `epic-tdd-infrastructure/`, `epic-design-system/`, `other/`. progress.md updated. | Fixed |
| 16 | All library READMEs are Nx-generated 12-line stubs | Low | Deleted all 6 stub READMEs. | Fixed |
| 17 | No "getting started" documentation | Low | Created `.context/getting-started.md` with prerequisites, setup, running, testing, and common tasks. Added to CLAUDE.md context files list. | Fixed |

### Non-Issues (Confirmed OK)

- ADR chain (005 → 007 → 008) for Tailwind/SCSS — well resolved with clear supersession trail
- Task file format — consistent structure across all 65 tasks
- Epic files — exceptional detail with risk analysis and acceptance criteria
- Cross-referencing between docs — strong and accurate

## 5. Developer Feedback Loop

**Rating: Good (B+)** - Strong AI-assisted workflow. Now hardened with pre-commit hooks and CI.

### Issues Found & Resolutions

| # | Issue | Severity | Resolution | Status |
|---|-------|----------|------------|--------|
| 18 | No pre-commit hooks — formatting/linting enforced only by AI discipline | High | Installed `husky` + `lint-staged`. Pre-commit runs `prettier --write` on staged `.ts/.html/.scss` files. | Fixed |
| 19 | No CI pipeline — zero automated quality gates | High | Created `.github/workflows/ci.yml`: format check, lint affected, type check, test affected, build affected. Runs on push/PR to master. | Fixed |
| 20 | Type-check depends solely on Claude Code hook | Medium | Now covered by both pre-commit (lint-staged) and CI (`tsc --noEmit` step). | Fixed |
| 21 | `pnpm format` script is forbidden but exists — footgun | Low | Removed the script entirely. `format:check` (read-only) kept. Per-file formatting via `npx prettier --write <file>`. | Fixed |

### Non-Issues (Confirmed OK)

- `tsc --noEmit` hook in Claude Code — effective for AI-assisted development
- `nx affected` for scoped test/lint/build runs — correct incremental approach
- test-runner / build-validator subagents — good automated quality checks
- Prettier per-file rule — prevents git history pollution

---

## Summary

| Dimension | Rating | Issues Found | Fixed | Deferred |
|-----------|--------|-------------|-------|----------|
| Project Structure | Solid | 3 | 2 | 1 |
| Tech Stack | Strong | 4 | 2 | 1 (+1 non-issue) |
| Testing Strategy | B+ | 4 | 3 | 1 |
| Documentation | A- | 6 | 5 (+1 non-issue) | 0 |
| Developer Feedback Loop | B+ | 4 | 4 | 0 |
| **Total** | | **21** | **16** | **3** |

### Deferred Items

| # | Item | When to Address |
|---|------|-----------------|
| 3 | Component file naming convention | On next touch — no bulk rename |
| 6 | Runtime environment config | When building API integration |
| 11 | Empty `api-e2e` project | When API has real endpoints |
