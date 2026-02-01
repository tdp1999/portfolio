# Epic: Test-Driven Development Infrastructure Setup

## Summary

Establish comprehensive Test-Driven Development (TDD) infrastructure with Jest for unit/integration testing and Playwright for E2E testing. Configure test runners, install testing libraries, create test utilities and patterns, and add retroactive tests to existing code (landing app and API). Enable the team to follow Red-Green-Refactor workflow with clear coverage targets: 90%+ for API endpoints, 80-90% for business logic, 70-80% for complex components.

## Why

**Problem:** Currently have no systematic testing approach, which creates risk of regressions, reduces confidence when refactoring, and makes debugging harder. As the portfolio project grows, untested code becomes technical debt.

**Value:**

- Catch bugs early in development cycle (cheaper to fix)
- Enable confident refactoring and feature additions
- Serve as living documentation of expected behavior
- Reduce manual testing time
- Improve code quality through TDD discipline

## Target Users

- Developers working on the portfolio (primarily you)
- Future contributors or maintainers
- Recruiters viewing code quality (tests demonstrate professionalism)

## Scope

### In Scope

- Install and configure Playwright for E2E testing **in headless mode** (no browser UI)
- Install Angular Testing Library for component testing
- Set up test utilities (factories, mocks, helpers)
- Create test examples and patterns documentation
- Add retroactive tests to existing landing app (basic health checks)
- Add retroactive tests to existing API app (controller and service tests)
- Configure test coverage reporting
- Set up test scripts in package.json
- Document TDD workflow in README or contributing guide
- **Use test-runner subagent** for running test suites and reporting results

### Out of Scope

- CI/CD pipeline integration (separate epic)
- Performance/load testing infrastructure
- Visual regression testing
- Contract testing between frontend and backend
- Test data seeding for integration tests (will use mocks initially)
- Dashboard app testing (dashboard doesn't exist yet)

## High-Level Requirements

1. **Install Playwright** with TypeScript support and configure for both apps (landing, future dashboard)
   - Configure to run in **headless mode** by default (no browser UI)
   - Set up headed mode option for debugging when needed
2. **Install Angular Testing Library** and configure with Jest for landing app
3. **Create test utilities library** in `libs/shared/testing` with:
   - Mock factories for common entities (Project, Experience, BlogPost, etc.)
   - API client mocks
   - Test data builders
   - Common test helpers
4. **Add basic E2E tests** for landing app:
   - Home page loads and displays correctly
   - Navigation between pages works
   - Theme toggle functionality
5. **Add retroactive unit tests** for API app:
   - AppController tests (health check endpoint)
   - AppService tests (basic service logic)
   - Example integration test pattern
6. **Add retroactive component tests** for landing app:
   - App component renders without errors
   - Basic routing works
7. **Configure test coverage reporting** with Jest coverage thresholds
8. **Document TDD workflow** with examples in patterns.md (already done) and add practical guide to README
9. **Set up test scripts** for easy running:
   - `pnpm test` - run all tests
   - `pnpm test:watch` - watch mode
   - `pnpm test:coverage` - with coverage report
   - `pnpm test:e2e` - E2E tests only (headless by default)
   - `pnpm test:e2e:headed` - E2E tests with browser UI (debugging)
10. **Establish workflow pattern** for main agent and test-runner subagent:

- Main agent writes tests (Red)
- Main agent writes code (Green)
- Main agent delegates to test-runner subagent for validation
- Test-runner subagent executes tests and reports pass/fail
- Main agent refactors based on results

## Technical Considerations

### Architecture

- **Monorepo Structure:** Tests co-located with source files (`.spec.ts` next to `.ts`)
- **Shared Testing Library:** `libs/shared/testing` provides reusable test utilities
- **Test Organization:**
  - Unit tests: `*.spec.ts` co-located with source
  - Integration tests: `*.integration.spec.ts` co-located
  - E2E tests: `apps/<app>/e2e/*.spec.ts` or dedicated `e2e/` folder
- **Nx Integration:** Use Nx test executors for caching and parallel execution
- **Subagent Usage:** Main agent delegates test execution to `test-runner` subagent
  - Subagent runs test suites and reports results
  - Main agent writes code and tests, subagent validates

### Playwright Configuration

- **Headless Mode:** Default configuration runs browsers in headless mode (no UI)
- **Headed Mode:** Available via `--headed` flag for debugging
- **Browser Selection:** Chromium only for MVP (can add Firefox/WebKit later)
- **Parallel Execution:** Tests run in parallel by default for speed

### Dependencies

- **Existing:** Jest already configured via Nx generators
- **New to Install:**
  - `@playwright/test` - E2E testing framework
  - `@angular/cdk/testing` - Angular component testing utilities
  - `@testing-library/angular` - Angular Testing Library
  - `jest-extended` - Additional Jest matchers (optional)
  - Coverage reporters: already included with Jest

### Data Model (Test Utilities)

```typescript
// libs/shared/testing/src/factories/project.factory.ts
export const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: '1',
  title: 'Mock Project',
  description: 'A test project',
  technologies: ['TypeScript', 'Angular'],
  startDate: '2024-01-01',
  url: 'https://example.com',
  ...overrides,
});

// libs/shared/testing/src/mocks/api-client.mock.ts
export const createMockApiClient = (): jest.Mocked<ApiClient> => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
});
```

### Integration Points

- **Nx Workspace:** Use `nx test <project>` commands
- **Package.json Scripts:** Add convenience scripts at workspace root
- **Jest Configuration:** Already present in `jest.config.ts` and `jest.preset.js`
- **Angular Build:** Angular Testing Library integrates with existing Angular test setup

## Risks & Warnings

⚠️ **Playwright Browser Downloads**

- Playwright downloads browser binaries (~400MB) on first install
- Can be slow on CI (but we're deferring CI setup)
- **Mitigation:** Document expected install time, use `pnpm dlx playwright install` for one-time setup

⚠️ **Test Maintenance Burden**

- Retroactive tests might not catch all edge cases without real user data
- Tests can become outdated if not maintained alongside code
- **Mitigation:** Start with critical paths only, expand coverage incrementally

⚠️ **Mock Data Drift**

- Mock factories might not match real API responses once backend is built
- **Mitigation:** Keep mocks simple initially, update when real API is implemented

⚠️ **E2E Test Flakiness**

- E2E tests can be flaky due to timing issues, animations, network delays
- **Mitigation:** Use Playwright's built-in waiting mechanisms, disable animations in test mode

⚠️ **Learning Curve**

- TDD workflow requires discipline and practice
- Writing tests first might feel slower initially
- **Mitigation:** Start with simple examples, reference patterns.md for guidance

⚠️ **Over-Testing**

- Risk of testing implementation details instead of behavior
- Risk of spending too much time on low-value tests (simple UI components)
- **Mitigation:** Follow pragmatic coverage targets, focus on critical paths

## Alternatives Considered

### Alternative 1: Only Unit Tests (No E2E)

- **Pros:** Simpler setup, faster test execution, lower maintenance
- **Cons:** Doesn't catch integration bugs, user flow issues, or frontend-backend mismatches
- **Why not chosen:** E2E tests provide high confidence in full user flows, critical for portfolio site quality

### Alternative 2: Strict TDD (90%+ Coverage for Everything)

- **Pros:** Maximum test coverage, highest confidence
- **Cons:** Significantly slower development, diminishing returns on simple components
- **Why not chosen:** Pragmatic approach balances quality with velocity; simple UI doesn't need 90% coverage

### Alternative 3: Cypress Instead of Playwright

- **Pros:** More established, larger community, better debugging UI
- **Cons:** Playwright has better TypeScript support, faster execution, better mobile testing
- **Why not chosen:** Playwright's TypeScript-first approach aligns better with this project's stack

### Alternative 4: Vitest Instead of Jest

- **Pros:** Faster, native ESM support, better Vite integration
- **Cons:** Jest already configured by Nx, larger ecosystem, more mature
- **Why not chosen:** Jest already set up and working, no compelling reason to switch

## Success Criteria

- [x] Playwright installed and can run basic E2E test
- [x] Angular Testing Library installed and can render test component
- [x] Test utilities library created with at least 3 mock factories
- [x] At least 2 E2E tests passing for landing app (home page, navigation)
- [x] At least 3 unit tests passing for API app (controller, service)
- [x] At least 1 component test passing for landing app
- [x] Test coverage report generates successfully
- [x] All test scripts work (`test`, `test:watch`, `test:coverage`, `test:e2e`)
- [x] TDD workflow documented with practical examples
- [x] Developer can run `pnpm test` and see all tests pass

## Estimated Complexity

**L (Large)**

**Reasoning:**

- Multiple technology installations (Playwright, Testing Library)
- Need to create shared testing utilities from scratch
- Retroactive testing requires understanding existing code
- Setting up E2E infrastructure is non-trivial
- Documentation and examples needed for future reference
- Estimated: 6-10 tasks, 8-12 hours of work

**Breakdown:**

- Setup tasks (3-4): Install tools, configure, create test lib
- Retroactive tests (2-3): API tests, component tests, E2E tests
- Documentation (1-2): Workflow guide, examples
- Verification (1): Run all tests, ensure everything works

## Related Epics/Dependencies

**Depends On:**

- Epic: Nx Monorepo Setup (epic-nx-monorepo-setup.md) - ✅ In Progress
  - Need landing app and API app to exist for retroactive testing
  - Tasks 001-003 completed

**Blocks:**

- Future feature development - all new features should follow TDD workflow
- Dashboard app development - will use same testing infrastructure

**Related:**

- CI/CD Pipeline Setup (future epic) - will run these tests in automation

## Notes

**On Retroactive Testing Priority:**

- Medium priority approach: Add retroactive tests in parallel with library generation tasks (004-007)
- This allows progress on both testing infrastructure and feature development
- Retroactive tests can be added incrementally as time permits

**On Test-First vs Test-After:**

- For retroactive tests: Writing tests after code is already written (unavoidable)
- For new code: Strictly follow TDD Red-Green-Refactor workflow

**On Coverage Thresholds:**

- Configure Jest to warn (not fail) when coverage drops below targets initially
- Gradually increase strictness as codebase matures

**On Subagent Usage:**

- Main agent handles: Writing code, writing tests, configuring tools
- Test-runner subagent handles: Running test suites, validating code, reporting results
- This separation ensures tests are actually run and results are properly validated
- Subagent can be triggered automatically after code changes (if auto_validation enabled)

**On Headless vs Headed Mode:**

- Headless mode (default): Faster, no UI overhead, suitable for CI/CD
- Headed mode (debugging): Shows browser UI, useful for debugging failing E2E tests
- Command: `pnpm test:e2e --headed` for headed mode

## Status

ready

## Created

2026-02-01

## Changelog

### [2026-02-01] Added Subagent Usage and Headless Mode

- **Added:** test-runner subagent will handle test execution and validation
- **Added:** Playwright configured to run in headless mode by default
- **Added:** Headed mode available via `--headed` flag for debugging
- **Workflow:** Main agent writes code/tests, test-runner subagent validates
- **Reason:** Separates concerns and ensures tests are actually run and validated properly
