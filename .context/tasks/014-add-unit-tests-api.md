# Task: Add Retroactive Unit Tests for API App

## Status: pending

## Goal
Write unit tests for existing NestJS API app, covering controllers and services with high coverage (90%+ target for APIs).

## Context
These are retroactive tests for the API app. Since the API is currently minimal (likely just health check), this task establishes testing patterns for future endpoints. Follow TDD patterns from `.context/patterns.md`.

## Acceptance Criteria
- [ ] At least 3 test files created:
  - `apps/api/src/app.controller.spec.ts` - Controller tests (health check endpoint)
  - `apps/api/src/app.service.spec.ts` - Service tests (business logic)
  - `apps/api/src/app.integration.spec.ts` - Integration test example (controller + service)
- [ ] All tests pass when run with `pnpm nx test api`
- [ ] Coverage for API app meets 90%+ threshold
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Mocks use Jest's built-in mocking capabilities

## Technical Notes
- NestJS has built-in testing utilities: `Test.createTestingModule()`
- Example controller test:
  ```typescript
  describe('AppController', () => {
    let controller: AppController;
    let service: AppService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        controllers: [AppController],
        providers: [AppService],
      }).compile();

      controller = module.get(AppController);
      service = module.get(AppService);
    });

    it('should return health status', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });
  });
  ```
- Reference: https://docs.nestjs.com/fundamentals/testing
- Reference `.context/patterns.md` for Testing Patterns

## Files to Touch
- `apps/api/src/app.controller.spec.ts` (update or create)
- `apps/api/src/app.service.spec.ts` (update or create)
- `apps/api/src/app.integration.spec.ts` (new file)

## Dependencies
- Task 012 (testing utilities library) - for shared mocks and helpers

## Complexity: M

## Progress Log
