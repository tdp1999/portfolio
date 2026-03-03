# Task: User Hardening — Code Quality Cleanup

## Status: pending

## Goal
Fix small code quality issues in the User module: partial repository updates, zod import fix, typed DTOs, repository void return, and BaseCommand initiator.

## Context
Phase 4 of epic-user-module-hardening. These are independent cleanup items that touch the same files. Can be done after Phase 1 but doesn't need to block functional work — sequence after task 126 to avoid merge conflicts.

## Acceptance Criteria

### Partial Repository Updates
- [ ] `UserRepository.update()` accepts a partial changeset (only changed fields) instead of full entity
- [ ] Only fields present in the changeset are sent to Prisma `update()`
- [ ] All callers in auth module (`setRefreshToken`, `incrementTokenVersion`, etc.) updated to pass partial changesets
- [ ] No regressions — all existing auth flows (login, refresh, logout, change-password) still pass tests

### Fix Zod Import
- [ ] `get-user-by-email.query.ts` line 3: `import { z } from 'zod'` changed to `import { z } from 'zod/v4'`

### Typed Query Responses
- [ ] `UserPublicDto` type defined (matches shape returned by `toPublicProps()`)
- [ ] Query handlers (`GetUserHandler`, `ListUsersHandler`) use `UserPublicDto` as explicit return type

### Repository `update()` Returns Void
- [ ] `UserRepository.update()` return type changed to `Promise<void>` (was returning boolean or entity)
- [ ] All callers that previously used the return value updated

### BaseCommand Initiator
- [ ] All User controller handlers pass `req.user.id` to command constructors as the initiator
- [ ] `'system'` string only used in seed script and any internal/scheduled operations
- [ ] `BaseCommand` type accepts `initiatorId: string` — verify the existing interface before changing

## Technical Notes
- Partial update: use `Partial<Prisma.UserUpdateInput>` or build the update object dynamically
- The biggest risk is callers of `repo.update()` in the auth module — read all usages before changing the signature
- `UserPublicDto` can be a TypeScript type alias or interface derived from `ReturnType<User['toPublicProps']>`

## Files to Touch
- `apps/api/src/modules/user/infrastructure/user.repository.ts`
- `apps/api/src/modules/auth/` (all files calling `userRepository.update()`)
- `apps/api/src/modules/user/application/queries/get-user-by-email.query.ts`
- `apps/api/src/modules/user/application/dtos/user-public.dto.ts` (new or existing)
- `apps/api/src/modules/user/application/queries/*.handler.ts`
- `apps/api/src/modules/user/infrastructure/user.controller.ts`
- Wherever `BaseCommand` initiator is currently hardcoded to `'system'`

## Dependencies
- [124] Foundation
- [126] Functional (all new handlers exist, so return types and partial updates can be finalized)

## Complexity: S

## Progress Log
