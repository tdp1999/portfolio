# Testing Guide

## Test-Driven Development (TDD)

### Workflow
```
Red → Green → Refactor
1. Write failing test for feature/fix
2. Write minimal code to pass test
3. Refactor while keeping tests green
4. Commit with tests included
```

### Coverage Targets
- **Business logic (services):** 80-90%
- **API endpoints:** 90%+
- **Complex components:** 70-80%
- **Utilities:** 90%+
- **Simple UI components:** Optional (focus on E2E)

### Test Organization
- **Co-located tests:** `.spec.ts` files next to source files
- **AAA Pattern:** Arrange → Act → Assert
- **One assertion per test:** Keep tests focused

### Testing Stack
- **Unit/Integration:** Jest (configured in workspace)
- **Component Testing:** Angular Testing Library
- **E2E:** Playwright (to be configured)
- **API Testing:** Supertest for NestJS

### Test Execution with Subagents
- **test-runner subagent:** Automatically runs tests after code changes
- **build-validator subagent:** Validates TypeScript types and production builds
- Check `.context/vision.md` frontmatter for `auto_validation: enabled` to trigger proactive validation

## When Adding Tests
1. Place `.spec.ts` next to source file
2. Use descriptive test names: `it('should return 404 when project not found')`
3. Mock external dependencies (API calls, databases)
4. Add `data-testid` attributes for E2E selectors
5. Test both happy paths AND error cases
