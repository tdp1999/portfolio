# Task: Configure Test Coverage Reporting

## Status: completed

## Goal
Set up Jest coverage reporting with appropriate thresholds for different types of code (API, business logic, components).

## Context
Coverage reporting provides visibility into which code is tested and which isn't. This task configures Jest to generate coverage reports and enforce pragmatic thresholds as defined in the epic and patterns.md.

## Acceptance Criteria
- [x] Jest coverage configuration added to `jest.config.ts` or `jest.preset.js` ✅
- [x] Coverage thresholds configured: ✅
  - API endpoints: 90%+ (apps/api) - Currently achieving 100%
  - Business logic: 90% (utils library) - Currently achieving 100%
  - Components: 70% (landing app) - Currently achieving 100%
  - Testing utilities: 55-60% (shared-testing) - Currently achieving ~58%
- [x] Coverage reports generate successfully with `pnpm test:coverage` ✅
- [x] Coverage output format: text (CLI only) ✅
- [x] Coverage reports excluded from git (add to `.gitignore`) ✅ (already present)
- [x] Pragmatic thresholds configured (set to achievable levels based on current coverage) ✅

## Technical Notes
- Update Jest config with:
  ```typescript
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './apps/api/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  }
  ```
- Coverage directories: `coverage/` at workspace root
- Exclude files: `*.spec.ts`, `*.config.ts`, `main.ts`, `index.ts`
- Reference: https://jestjs.io/docs/configuration#coveragethreshold

## Files to Touch
- `jest.config.ts` or `jest.preset.js` (update coverage config)
- `package.json` (add `test:coverage` script if not exists)
- `.gitignore` (add `coverage/` directory)

## Dependencies
- Tasks 014, 015 (tests must exist to measure coverage)

## Complexity: S

## Progress Log

### 2026-02-01

**Global Coverage Configuration (`jest.preset.js`):**
- Added `coverageReporters: ['text']` for CLI-only output
  - Text format displays coverage table in console
  - No HTML or LCOV files generated
  - No coverage directory created
- Configured `collectCoverageFrom` to exclude:
  - Test files (*.spec.{js,ts})
  - Config files (*.config.{js,ts}, *.cts)
  - Entry points (main.ts, index.ts)
  - Jest configs
  - Node modules and build outputs

**API App Configuration (`apps/api/jest.config.cts`):**
- Added 90% coverage threshold for all metrics
- Currently achieving 100% coverage (15 tests)
- Covers controller, service, and integration tests

**Landing App Configuration (`apps/landing/jest.config.cts`):**
- Added 70% coverage threshold for components
- Configured `collectCoverageFrom` to only include `src/app/` directory
- Excluded server files (*.server.ts, *.routes*.ts, *.config*.ts)
- Currently achieving 100% coverage (26 tests)
- Only measures actual component files (app.ts, nx-welcome.ts)

**Utils Library Configuration (`libs/utils/jest.config.cts`):**
- Added 90% coverage threshold for utilities
- Currently achieving 100% coverage (2 tests)
- High threshold appropriate for shared utilities

**Shared Testing Library Configuration (`libs/shared/testing/jest.config.cts`):**
- Added pragmatic 55-60% threshold
- Currently achieving ~58% coverage (16 tests)
- Lower threshold acceptable because:
  - Contains test factories that may not all be used yet
  - Blog and experience factories have 0% coverage (not used)
  - Project factory has 100% coverage (actively used)
  - Test helpers have 93% coverage

**Verification:**
- ✅ `pnpm test:coverage` runs successfully for all 7 projects
- ✅ Text output displays coverage table in console
- ✅ No coverage directory created (text-only output)
- ✅ All thresholds pass without failures
- ✅ Clean CLI output without file generation

**Coverage Summary by Project:**
| Project | Coverage | Threshold | Status |
|---------|----------|-----------|--------|
| API | 100% | 90% | ✅ Exceeds |
| Landing | 100% | 70% | ✅ Exceeds |
| Utils | 100% | 90% | ✅ Meets |
| Shared Testing | ~58% | 55-60% | ✅ Meets |
| UI | 100% | None | ✅ Pass |
| API Client | 100% | None | ✅ Pass |
| Types | 0% | None | ✅ Pass (type-only) |
