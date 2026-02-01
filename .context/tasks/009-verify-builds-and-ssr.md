# Task: Verify All Builds and SSR

## Status: in-progress

## Goal

Verify that all applications and libraries build successfully and that Angular SSR works correctly.

## Context

This is the final verification task to ensure the monorepo setup is complete and working. All previous tasks must be done before this verification.

## Acceptance Criteria

- [ ] `pnpm install` completes without errors
- [ ] `nx build types` succeeds
- [ ] `nx build utils` succeeds
- [ ] `nx build ui` succeeds
- [ ] `nx build api-client` succeeds
- [ ] `nx build landing` produces SSR build
- [ ] `nx build api` produces NestJS build
- [ ] `nx serve landing` starts with SSR working
- [ ] `nx serve api` starts NestJS server
- [ ] `nx lint` passes for all projects
- [ ] `nx graph` shows correct dependency graph
- [ ] Import paths `@portfolio/*` resolve correctly

## Technical Notes

Test SSR by:

1. Run `nx serve landing`
2. View page source in browser - should see rendered HTML (not empty `<app-root>`)
3. Check terminal for SSR logs

Test library imports by adding to landing app:

```typescript
import { BaseEntity } from '@portfolio/types';
import { formatDate } from '@portfolio/utils';
```

Run full build:

```bash
nx run-many -t build --all
```

## Files to Touch

- None (verification only)

## Dependencies

- 001-init-nx-workspace
- 002-generate-angular-landing
- 003-generate-nestjs-api
- 004-generate-types-library
- 005-generate-utils-library
- 006-generate-ui-library
- 007-generate-api-client-library
- 008-configure-eslint-prettier

## Complexity: S
