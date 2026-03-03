# Task: Admin Seed Script

## Status: pending

## Goal
Create an idempotent Prisma seed script that creates the first admin user from environment variables.

## Context
Part of epic-user-module-hardening Phase 1. The seed script is the only way to create the initial admin user. Must be carefully tested since it runs in production.

## Acceptance Criteria
- [ ] `apps/api/prisma/seed.ts` created
- [ ] Reads `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` from env
- [ ] Validates password meets project rules (8+ chars, upper, lower, number, special) before hashing
- [ ] Creates user with `role: ADMIN`, bcrypt-hashed password
- [ ] Idempotent — if email already exists, logs a message and skips (no error, no duplicate)
- [ ] `prisma.seed` configured in `package.json` (points to ts-node or tsx execution)
- [ ] Runs successfully via `pnpm prisma db seed`
- [ ] Unit test: validates the seed logic (mock Prisma client, test idempotency, test password validation failure)
- [ ] Missing env vars produce a clear error message (not a cryptic crash)

## Technical Notes
- Use existing `hashPassword` utility from auth module for bcrypt hashing
- Password validation: reuse or import the existing password Zod schema
- Consider using `tsx` for running the seed (check if already a dev dependency)

## Files to Touch
- `apps/api/prisma/seed.ts` (new)
- `apps/api/package.json` (prisma.seed config)

## Dependencies
- [124] Foundation (Role enum must exist in schema)

## Complexity: S

## Progress Log
