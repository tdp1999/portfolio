# Architecture Decision Records

## 2026-01-30: Initial Architecture Decisions

### ADR-001: Monorepo Structure

**Status:** Accepted
**Context:** Need to share code between landing page and dashboard
**Decision:** Use pnpm workspaces with Nx for build orchestration
**Consequences:** Shared types, UI components, and utilities across apps

### ADR-002: Angular for Frontend

**Status:** Accepted
**Context:** Framework choice for both landing and dashboard
**Decision:** Angular 19+ with SSR for landing, SPA for dashboard
**Consequences:** Familiar patterns, strong typing, good enterprise tooling

### ADR-003: NestJS for Backend

**Status:** Accepted
**Context:** API framework selection
**Decision:** NestJS with layered architecture (Controllers → Services → Repositories)
**Consequences:** Angular-like patterns, great TypeScript support, Prisma integration

### ADR-004: Stage 1 Mock Data Strategy

**Status:** Accepted
**Context:** Need to develop without database initially
**Decision:** JSON files in /data/mock with API abstraction layer
**Consequences:** Easy swap to real database later, can develop full flow immediately

### ADR-005: Tailwind CSS for Styling

**Status:** Accepted
**Context:** Styling approach for consistent design
**Decision:** Tailwind CSS 4.x with custom theme for dark/light modes
**Consequences:** Utility-first approach, easy theming, consistent across apps

### ADR-006: Test-Driven Development (TDD) Approach

**Status:** Accepted
**Date:** 2026-02-01

**Context:** Need to ensure code quality, prevent regressions, and maintain development confidence as the project grows. Given the portfolio nature and the need for reliability, adopting a testing strategy early is critical.

**Decision:** Adopt pragmatic Test-Driven Development (TDD) approach with the following:

- **Testing Stack:**
  - Jest for unit and integration testing (already configured)
  - Playwright for end-to-end testing
  - Supertest for API endpoint testing (optional)
- **Coverage Targets:**
  - API endpoints: 90%+ coverage (critical path)
  - Business logic (services): 80-90% coverage
  - Complex components: 70-80% coverage
  - Simple UI components: Optional (focus on integration/E2E)
- **TDD Workflow:** Red-Green-Refactor cycle
  1. Write failing test first
  2. Implement minimal code to pass
  3. Refactor while keeping tests green
  4. Commit with tests included

**Rationale:**

- Pragmatic approach balances quality with development velocity
- Focus on critical paths (API, business logic) ensures reliability where it matters most
- Jest already configured in workspace, low barrier to entry
- Playwright provides robust E2E testing for user flows
- TDD workflow catches bugs early and serves as living documentation

**Alternatives Considered:**

- **No testing:** Rejected - too risky for production portfolio site
- **Strict TDD (90%+ all code):** Rejected - too time-consuming for simple UI components
- **Testing after implementation:** Rejected - often skipped under time pressure

**Consequences:**

- All new features must include tests written before implementation
- Increased initial development time per feature (~20-30%)
- Higher confidence in deployments and refactoring
- Tests serve as documentation for expected behavior
- Need to set up Playwright for E2E testing
- CI/CD pipeline must run all tests before deployment

**Impact on Existing Work:**

- Existing generated code (landing app, API app) will have tests added retroactively for critical paths
- Future tasks should allocate time for writing tests first
