# Task: Configure Test Coverage Reporting

## Status: pending

## Goal
Set up Jest coverage reporting with appropriate thresholds for different types of code (API, business logic, components).

## Context
Coverage reporting provides visibility into which code is tested and which isn't. This task configures Jest to generate coverage reports and enforce pragmatic thresholds as defined in the epic and patterns.md.

## Acceptance Criteria
- [ ] Jest coverage configuration added to `jest.config.ts` or `jest.preset.js`
- [ ] Coverage thresholds configured:
  - API endpoints: 90%+ (global for apps/api)
  - Business logic: 80-90% (services, utilities)
  - Components: 70-80% (UI components)
- [ ] Coverage reports generate successfully with `pnpm test:coverage`
- [ ] Coverage output formats: text (console), html (for detailed browsing), lcov (for CI integration later)
- [ ] Coverage reports excluded from git (add to `.gitignore`)
- [ ] Thresholds set to warn (not fail) initially

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
