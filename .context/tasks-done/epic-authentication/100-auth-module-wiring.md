# Task: Auth - Module Wiring & Integration Verification

## Status: done

## Goal

Wire all auth components together, verify the complete module works end-to-end.

## Context

Final task — ensures all handlers, guards, controllers, and services are properly registered and the module functions as a whole.

## Acceptance Criteria

- [x] AuthModule properly imports UserModule, EmailModule, JwtModule
- [x] All command/query handlers registered in AuthModule providers
- [x] All guards registered and applied correctly
- [x] Auth controller routes all wired and responding
- [x] Integration test: full login → refresh → logout flow works
- [x] Integration test: forgot-password → reset-password flow works
- [x] All auth-related tests pass (`nx test api --testPathPattern=auth`)
- [x] Type check passes (`npx tsc --noEmit`)
- [x] No circular dependencies between Auth and User modules

## Technical Notes

Verify the full vertical slice works by running through each flow manually or via integration tests. Check that:
- UserModule exports what AuthModule needs (IUserRepository)
- EmailModule is globally available
- Guards are applied at controller method level, not module level
- Error responses follow DomainError/DomainExceptionFilter pattern

## Files to Touch

- apps/api/src/modules/auth/auth.module.ts (final wiring)
- apps/api/src/app/app.module.ts (verify imports)
- apps/api/src/modules/auth/**/*.spec.ts (verify all tests)

## Dependencies

- All auth tasks 089-098 must be complete

## Complexity: M

## Progress Log
- [2026-02-25] Started. Added GoogleOAuthGuard to AuthModule providers. All 186 tests pass, type check clean, no circular deps.
- [2026-02-25] Added DomainExceptionFilter, cookie-parser, integration tests. All 198 tests pass.
