# Testing Guide

> **Single source of truth for all testing patterns and TDD workflow.**
> Referenced from: CLAUDE.md, patterns.md, vision.md

## Test-Driven Development (TDD)

### Workflow
```
Red → Green → Refactor
1. Write failing test for feature/fix
2. Write minimal code to pass test
3. Delegate test execution to test-runner subagent
4. Refactor while keeping tests green
5. Commit with tests included
```

### Coverage Targets
| Area | Target | Notes |
|------|--------|-------|
| Business logic (services) | 80-90% | Core application logic |
| API endpoints | 90%+ | All routes tested |
| Complex components | 70-80% | Interactive UI |
| Utilities | 90%+ | Pure functions |
| Simple UI components | Optional | Focus on E2E instead |

### Test Organization
- **Co-located tests:** `.spec.ts` files next to source files
- **AAA Pattern:** Arrange → Act → Assert
- **One assertion per test:** Keep tests focused
- **Descriptive names:** `it('should return 404 when project not found')`

### Testing Stack
| Type | Tool | Notes |
|------|------|-------|
| Unit/Integration | Jest | Configured in workspace |
| Component Testing | Angular Testing Library | For Angular components |
| E2E | Playwright | playwright-skill plugin available |
| API Testing | Supertest | For NestJS endpoints |

## Automated Testing with Subagents

### test-runner subagent
- **Runs:** Tests for AFFECTED code only (uses `nx affected`)
- **Triggers:** Automatically after significant code changes when `auto_validation: enabled`
- **Output:** Pass/fail status with specific error locations

### build-validator subagent
- **Runs:** TypeScript type-check and build for AFFECTED projects
- **Triggers:** Automatically after feature completion when `auto_validation: enabled`
- **Output:** Type errors and build issues with file:line references

### Enabling Auto-Validation
Add frontmatter to `.context/vision.md`:
```yaml
---
auto_validation: enabled
---
```

### Post-Edit Hook
A post-edit hook in `.claude/settings.json` runs type-check after file edits:
```json
{
  "hooks": {
    "PostToolUse": [{ "matcher": "Edit|Write", ... }]
  }
}
```

## When Adding Tests

1. Place `.spec.ts` next to source file
2. Use descriptive test names
3. Mock external dependencies (API calls, databases)
4. Add `data-testid` attributes for E2E selectors
5. Test both happy paths AND error cases
6. Run via test-runner subagent (don't run tests directly)

## Test Patterns

See `patterns.md` for detailed code patterns:
- AAA (Arrange-Act-Assert) structure
- API endpoint testing pattern
- Component testing pattern
- E2E testing pattern (Playwright)
- Test data factories
- Mock service pattern
