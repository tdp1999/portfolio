# Task: Auth - Account Locking

## Status: done

## Goal

Implement account locking after 5 failed login attempts with exponential backoff.

## Context

Brute-force protection. Locks the account temporarily after repeated failures, with increasing lockout durations.

## Acceptance Criteria

- [x] Failed login increments `failedLoginAttempts` on User
- [x] After 5 failures, account is locked with exponential backoff: 1min, 5min, 15min, 30min, 1hr cap
- [x] Successful login resets `failedLoginAttempts` to 0 and clears `lockedUntil`
- [x] Login while locked returns generic "Invalid credentials" (no lock status leak)
- [x] Lock check happens before password comparison (avoid timing attacks)
- [x] Unit tests: lock after 5 attempts, exponential backoff durations, reset on success, locked login rejected

## Technical Notes

Backoff calculation:
```typescript
const BACKOFF_MINUTES = [1, 5, 15, 30, 60]; // cap at 60
const lockIndex = Math.min(failedAttempts - 5, BACKOFF_MINUTES.length - 1);
const lockDuration = BACKOFF_MINUTES[lockIndex];
```

This logic integrates into the `LoginCommand` handler from task 092. Can be extracted into a domain service or kept in the handler.

The lock check order in login:
1. Find user by email (generic error if not found)
2. Check `isLocked()` (generic error if locked)
3. Compare password
4. On failure: `incrementFailedAttempts()`, possibly `lock(until)`
5. On success: `resetFailedAttempts()`

## Files to Touch

- apps/api/src/modules/auth/application/commands/login.command.ts (integrate locking)
- apps/api/src/modules/auth/application/commands/login.command.spec.ts (add locking tests)

## Dependencies

- 092-auth-login-logout (login handler must exist to integrate into)
- 089-auth-schema-migration (lock-related entity methods)

## Complexity: S

## Progress Log

- [2026-02-25] Started
- [2026-02-25] Added 5 locking tests + exponential backoff logic in LoginHandler. All 133 tests pass.
